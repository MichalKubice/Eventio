import { rabbitWrapper } from "../rabbit/rabbit-wrapper";

export abstract class BaseListener<T> {
  abstract exchange: string;
  abstract queueName: string;
  abstract onMessage(data: T): void;

  // Maximum retry attempts before sending to dead letter queue
  maxRetries = 3;

  // Delay between retries in milliseconds
  retryDelay = 5000;

  async listen() {
    const channel = rabbitWrapper.channel;

    // Dead letter exchange for failed messages
    const deadLetterExchange = `${this.exchange}.dlx`;
    const deadLetterQueue = `${this.queueName}.dlq`;

    // Assert dead letter exchange and queue
    await channel.assertExchange(deadLetterExchange, "fanout", {
      durable: true,
    });
    await channel.assertQueue(deadLetterQueue, {
      durable: true,
    });
    await channel.bindQueue(deadLetterQueue, deadLetterExchange, "");

    // Assert main exchange with durable option
    await channel.assertExchange(this.exchange, "fanout", { durable: true });

    // Assert main queue with dead letter configuration
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

    await channel.consume(
      q.queue,
      async (msg: any | null) => {
        if (msg) {
          const retryCount = this.getRetryCount(msg);

          try {
            const data = JSON.parse(msg.content.toString());
            await this.onMessage(data);
            channel.ack(msg);
          } catch (err) {
            console.error(
              `Listener ${this.queueName} error (retry ${retryCount}/${this.maxRetries}):`,
              err
            );

            // Check if we should retry
            if (retryCount < this.maxRetries) {
              // Reject and requeue with delay
              setTimeout(() => {
                channel.nack(msg, false, true);
              }, this.retryDelay);
            } else {
              // Max retries reached, send to dead letter queue
              console.error(
                `Max retries reached for message, sending to DLQ: ${this.queueName}`
              );
              channel.nack(msg, false, false);
            }
          }
        }
      },
      {
        // Manual acknowledgment - we control when messages are acked/nacked
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
