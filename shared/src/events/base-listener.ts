import { rabbitWrapper } from "../rabbit/rabbit-wrapper";

export abstract class BaseListener<T> {
  abstract exchange: string;
  abstract queueName: string;
  abstract onMessage(data: T): void | Promise<void>;

  maxRetries = 3;

  retryDelay = 5000;

  private processingCount = 0;
  private maxConcurrentProcessing = 5;
  private isShuttingDown = false;

  async listen() {
    const channel = rabbitWrapper.channel;

    const deadLetterExchange = `${this.exchange}.dlx`;
    const deadLetterQueue = `${this.queueName}.dlq`;

    await channel.assertExchange(deadLetterExchange, "fanout", {
      durable: true,
    });
    await channel.assertQueue(deadLetterQueue, {
      durable: true,
    });
    await channel.bindQueue(deadLetterQueue, deadLetterExchange, "");

    await channel.assertExchange(this.exchange, "fanout", { durable: true });

    const q = await channel.assertQueue(this.queueName, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": deadLetterExchange,
      },
    });
    await channel.bindQueue(q.queue, this.exchange, "");

    console.log(
      `Listening on exchange: ${this.exchange} (queue: ${this.queueName})`
    );
    console.log(`Dead letter queue: ${deadLetterQueue}`);

    // Graceful shutdown handler
    const shutdown = async () => {
      this.isShuttingDown = true;
      console.log(
        `[${this.queueName}] Graceful shutdown initiated, waiting for ${this.processingCount} messages to complete...`
      );

      // Wait for all messages to complete processing
      while (this.processingCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`[${this.queueName}] All messages processed, ready to exit`);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    await channel.consume(
      q.queue,
      async (msg: any | null) => {
        if (!msg) return;

        if (this.isShuttingDown) {
          console.log(`[${this.queueName}] Rejecting message during shutdown`);
          channel.nack(msg, false, true);
          return;
        }
        if (this.processingCount >= this.maxConcurrentProcessing) {
          console.warn(
            `[${this.queueName}] At capacity (${this.processingCount}/${this.maxConcurrentProcessing}), applying backpressure`
          );
          channel.nack(msg, false, true);
          return;
        }

        this.processingCount++;
        const currentCount = this.processingCount;

        console.log(
          `[${this.queueName}] Processing message (${currentCount}/${this.maxConcurrentProcessing} active)`
        );

        const retryCount = this.getRetryCount(msg);

        try {
          const data = JSON.parse(msg.content.toString());
          const result = this.onMessage(data);
          if (result instanceof Promise) {
            await result;
          }
          channel.ack(msg);
          console.log(
            `[${this.queueName}] Message processed successfully (${
              this.processingCount - 1
            }/${this.maxConcurrentProcessing} remaining)`
          );
        } catch (err) {
          console.error(
            `[${this.queueName}] Error (retry ${retryCount}/${this.maxRetries}):`,
            err instanceof Error ? err.message : err
          );

          if (retryCount < this.maxRetries) {
            const headers = msg.properties.headers || {};
            headers["x-retry-count"] = retryCount + 1;

            const retryExchange = `${this.exchange}.retry`;
            await channel.assertExchange(retryExchange, "fanout", {
              durable: true,
            });

            await channel.publish(retryExchange, "", msg.content, {
              headers,
              persistent: true,
            });

            setTimeout(async () => {
              await channel.bindQueue(q.queue, retryExchange, "");
            }, this.retryDelay);

            channel.ack(msg);
            console.log(
              `[${this.queueName}] Message queued for retry ${retryCount + 1}/${
                this.maxRetries
              } in ${this.retryDelay}ms`
            );
          } else {
            console.error(
              `[${this.queueName}] Max retries reached, sending to DLQ`
            );
            channel.nack(msg, false, false);
          }
        } finally {
          this.processingCount--;
        }
      },
      {
        noAck: false,
      }
    );
  }

  private getRetryCount(msg: any): number {
    if (!msg.properties.headers) {
      return 0;
    }
    return msg.properties.headers["x-retry-count"] || 0;
  }
}
