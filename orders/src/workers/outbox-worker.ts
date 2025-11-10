import { OutboxEvent, OutboxStatus, OutboxEventDoc } from "../models/outbox-event";
import { BasePublisher } from "@mkeventio/shared";

export class OutboxWorker {
  private intervalId?: NodeJS.Timeout;
  private isProcessing = false;
  private readonly intervalMs: number;
  private readonly batchSize: number;
  private readonly maxRetries: number;

  constructor(options?: {
    intervalMs?: number;
    batchSize?: number;
    maxRetries?: number;
  }) {
    this.intervalMs = options?.intervalMs || 2000; // 2 sekundy
    this.batchSize = options?.batchSize || 10;
    this.maxRetries = options?.maxRetries || 3;
  }

  start() {
    console.log(
      `[OUTBOX WORKER] Starting with interval ${this.intervalMs}ms, batch size ${this.batchSize}`
    );

    this.intervalId = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processBatch();
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log("[OUTBOX WORKER] Stopped");
    }
  }

  private async processBatch() {
    this.isProcessing = true;

    try {
      const events = await OutboxEvent.find({
        status: OutboxStatus.Pending,
        attempts: { $lt: this.maxRetries },
      })
        .sort({ createdAt: 1 })
        .limit(this.batchSize);

      if (events.length === 0) {
        return;
      }

      console.log(`[OUTBOX WORKER] Processing ${events.length} events`);

      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error("[OUTBOX WORKER] Batch processing error:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: OutboxEventDoc) {
    try {
      event.attempts += 1;

      const publisher = new GenericPublisher(event.exchange);
      await publisher.publish(event.payload);

      event.status = OutboxStatus.Published;
      event.publishedAt = new Date();
      event.lastError = undefined;

      await event.save();

      console.log(
        `[OUTBOX WORKER] ✓ Published event ${event.id} (${event.eventType}) to ${event.exchange}`
      );
    } catch (error: any) {
      console.error(
        `[OUTBOX WORKER] ✗ Failed to publish event ${event.id}:`,
        error.message
      );

      event.lastError = error.message;

      if (event.attempts >= this.maxRetries) {
        event.status = OutboxStatus.Failed;
        console.error(
          `[OUTBOX WORKER] Event ${event.id} marked as FAILED after ${event.attempts} attempts`
        );
      }

      await event.save();
    }
  }

  async getStats() {
    const [pending, published, failed] = await Promise.all([
      OutboxEvent.countDocuments({ status: OutboxStatus.Pending }),
      OutboxEvent.countDocuments({ status: OutboxStatus.Published }),
      OutboxEvent.countDocuments({ status: OutboxStatus.Failed }),
    ]);

    return { pending, published, failed };
  }
}

class GenericPublisher extends BasePublisher<any> {
  constructor(public exchange: string) {
    super();
  }
}
