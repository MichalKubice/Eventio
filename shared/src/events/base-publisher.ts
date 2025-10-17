import { rabbitWrapper } from "../rabbit/rabbit-wrapper";

export abstract class BasePublisher<T> {
  abstract queue: string;

  async publish(data: T) {
    const channel = rabbitWrapper.channel;
    await channel.assertQueue(this.queue);
    channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(data)));
    console.log(`📤 Event published to ${this.queue}`);
  }
}
