import amqplib, { Connection } from "amqplib";

class RabbitmqWrapper {
  private _client!: Connection;

  get client() {
    if (!this._client) {
      throw new Error("Cannot access rabbitmq client before connecting");
    }
    return this._client;
  }

  async connect() {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL as string);
    console.log("Connected to Rabbitmq successfully");
    this._client = conn;
  }
}

export const rabbitmqWrapper = new RabbitmqWrapper();
