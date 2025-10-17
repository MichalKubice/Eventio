import { rabbitWrapper } from "../rabbit/rabbit-wrapper";

export abstract class BaseListener<T> {
  abstract queue: string;
  abstract onMessage(data: T): void;

  async listen() {
    const channel = rabbitWrapper.channel;
    await channel.assertQueue(this.queue);
    console.log(`👂 Listening on queue: ${this.queue}`);

    await channel.consume(this.queue, (msg: any | null) => {
      if (msg) {
        const data = JSON.parse(msg.content.toString());
        this.onMessage(data);
        channel.ack(msg);
      }
    });
  }
}
