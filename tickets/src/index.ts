import express from "express";
import { json } from "body-parser";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import { connectRabbitWithRetry, errorHandler } from "@mkeventio/shared";
import { NotFoundError, currentUser } from "@mkeventio/shared";

import {
  createTicketRouter,
  indexTicketRouter,
  showTicketRouter,
  startSaleRouter,
  updateTicketRouter,
} from "./routes/index";

import { OrderCancelledListener } from "./events/listeners/order-cancelled-listener";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";
import { OrderCompletedListener } from "./events/listeners/order-completed-listener";
import { connectRedisWithRetry } from "@mkeventio/shared";

const app = express();
app.use(json());

app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(currentUser);

app.use(createTicketRouter);
app.use(indexTicketRouter);
app.use(showTicketRouter);
app.use(updateTicketRouter);
app.use(startSaleRouter);

app.use(errorHandler);

app.all("*", (req, res, next) => {
  next(new NotFoundError());
});

const start = async () => {
  try {
    if (!process.env.JWT_KEY) {
      throw new Error("JWT_KEY must be defined");
    }
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI must be defineds");
    }
    if (!process.env.RABBITMQ_URL)
      throw new Error("RABBITMQ_URL must be defined!");

    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL must be defined");
    }

    await connectRedisWithRetry(process.env.REDIS_URL);
    await mongoose.connect("mongodb://tickets-mongo-srv:27017/tickets");

    console.log("Connected to MongoDb");

    await connectRabbitWithRetry(process.env.RABBITMQ_URL);

    console.log("✅ Connected to RabbitMQ");

    await new OrderCreatedListener().listen();
    await new OrderCancelledListener().listen();
    await new OrderCompletedListener().listen();
  } catch (err) {
    console.error(err);
  }
};

app.listen(3000, () => {
  console.log("Ticket service listening on port 3000.");
});

start();

export { app };
