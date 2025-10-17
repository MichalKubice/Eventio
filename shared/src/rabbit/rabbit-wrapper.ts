const amqp = require("amqplib");

class RabbitWrapper {
  private _connection?: any;
  private _channel?: any;

  get channel() {
    if (!this._channel) {
      throw new Error("Cannot access Rabbit channel before connecting");
    }
    return this._channel;
  }

  async connect(url: string) {
    this._connection = await amqp.connect(url);
    this._channel = await this._connection.createChannel();
    console.log("Connected to RabbitMQ");

    process.on("SIGINT", async () => {
      await this.close();
      process.exit();
    });

    process.on("SIGTERM", async () => {
      await this.close();
      process.exit();
    });
  }

  async close() {
    console.log("Closing RabbitMQ connection...");
    await this._channel?.close();
    await this._connection?.close();
  }
}

export const rabbitWrapper = new RabbitWrapper();
