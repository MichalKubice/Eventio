import mongoose from "mongoose";
import { OrderRejectedListener } from "./events/listeners/order-rejected-listener";
import express from "express";
import { json } from "body-parser";
import cookieSession from "cookie-session";
import {
  errorHandler,
  NotFoundError,
  connectRabbitWithRetry,
  currentUser,
} from "@mkeventio/shared";
import { createPaymentRouter } from "./routes/create";
import { OrderAcceptedListener } from "./events/listeners/order-accepted-listener";
import { OrderCancelledListener } from "./events/listeners/order-canceled-listener";

const app = express();
app.set("trust proxy", true);
app.use(json());

app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(currentUser);

app.use(createPaymentRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
  try {
    if (!process.env.JWT_KEY) throw new Error("JWT_KEY must be defined");
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be defined");
    if (!process.env.RABBITMQ_URL)
      throw new Error("RABBITMQ_URL must be defined");

    await connectRabbitWithRetry(process.env.RABBITMQ_URL);
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB & RabbitMQ");

    await new OrderRejectedListener().listen();
    await new OrderAcceptedListener().listen();
    await new OrderCancelledListener().listen();

    app.listen(3000, () => {
      console.log("💳 Payments service listening on port 3000");
    });
  } catch (err) {
    console.error(err);
  }
};

start();
