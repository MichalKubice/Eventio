import { rabbitWrapper } from "../rabbit/rabbit-wrapper";

export abstract class BaseListener<T> {
  abstract exchange: string;
  abstract queueName: string;
  abstract onMessage(data: T): void;

  async listen() {
    const channel = rabbitWrapper.channel;

    await channel.assertExchange(this.exchange, "fanout", { durable: false });
    const q = await channel.assertQueue(this.queueName, { durable: false });
    await channel.bindQueue(q.queue, this.exchange, "");

    console.log(
      `Listening on exchange: ${this.exchange} (queue: ${this.queueName})`
    );

    await channel.consume(q.queue, async (msg: any | null) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          await this.onMessage(data);
          channel.ack(msg);
        } catch (err) {
          console.error(`Listener ${this.queueName} error:`, err);
        }
      }
    });
  }
}
