import mongoose from "mongoose";
import { OrderRejectedListener } from "./events/listeners/order-rejected-listener";
import express from "express";
import { json } from "body-parser";
import cookieSession from "cookie-session";
import { errorHandler, NotFoundError, rabbitWrapper } from "@mkeventio/shared";
import { createPaymentRouter } from "./routes/create";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(createPaymentRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
  try {
    if (!process.env.JWT_KEY) throw new Error("JWT_KEY must be defined");
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be defined");
    if (!process.env.RABBITMQ_URL) throw new Error("RABBITMQ_URL must be defined");

    await rabbitWrapper.connect(process.env.RABBITMQ_URL);
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB & RabbitMQ");

    new OrderRejectedListener().listen();

    app.listen(3000, () => {
      console.log("💳 Payments service listening on port 3000");
    });
  } catch (err) {
    console.error(err);
  }
};

start();
