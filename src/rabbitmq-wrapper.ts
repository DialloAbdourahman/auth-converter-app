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
    const conn = await amqplib.connect(
      `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@localhost:5672`
    );
    console.log("Connected to Rabbitmq successfully");
    this._client = conn;
  }
}

export const rabbitmqWrapper = new RabbitmqWrapper();
