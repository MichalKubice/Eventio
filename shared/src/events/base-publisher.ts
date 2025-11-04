import { rabbitWrapper } from "../rabbit/rabbit-wrapper";

export abstract class BasePublisher<T> {
  abstract exchange: string;

  async publish(data: T) {
    const channel = rabbitWrapper.channel;
    await channel.assertExchange(this.exchange, "fanout", { durable: false });
    channel.publish(this.exchange, "", Buffer.from(JSON.stringify(data)));

    console.log(`Event published to exchange: ${this.exchange}`);
  }
}
