import express from "express";
import { json } from "body-parser";
import mongoose from "mongoose";
import cookieSession from "cookie-session";

import { errorHandler } from "@mkeventio/shared";
import { NotFoundError } from "@mkeventio/shared";

import {
  deleteOrderRouter,
  createOrderRouter,
  indexOrderRouter,
  showOrderRouter,
} from "./routes/index";

import { currentUser, connectRabbitWithRetry } from "@mkeventio/shared";
import { TicketCreatedListener } from "./events/listeners/ticket-created-listener";
import { TicketUpdatedListener } from "./events/listeners/ticket-updated-listener";
import { OrderAcceptedListener } from "./events/listeners/order-accepted-listener";
import { OrderRejectedListener } from "./events/listeners/order-rejected-listener";
import { OrderCompletedListener } from "./events/listeners/order-completed-listener";
import { OrderExpiredListener } from "./events/listeners/order-expired-listener";
import { OutboxWorker } from "./workers/outbox-worker";

const app = express();
app.set("trust proxy", true);

app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(currentUser);

app.use(json());

app.use(createOrderRouter);
app.use(indexOrderRouter);
app.use(showOrderRouter);
app.use(deleteOrderRouter);

app.use(errorHandler);

app.all("*", (req, res, next) => {
  next(new NotFoundError());
});

let outboxWorker: OutboxWorker;

const start = async () => {
  try {
    if (!process.env.JWT_KEY) {
      throw new Error("JWT_KEY must be defined");
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI must be defined");
    }

    if (!process.env.RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL must be defineds");
    }

    await connectRabbitWithRetry(process.env.RABBITMQ_URL);
    await mongoose.connect("mongodb://orders-mongo-srv:27017/orders");
    console.log("Connected to MongoDb");

    await new TicketCreatedListener().listen();
    await new TicketUpdatedListener().listen();
    await new OrderAcceptedListener().listen();
    await new OrderRejectedListener().listen();
    await new OrderCompletedListener().listen();
    await new OrderExpiredListener().listen();

    // OUTBOX WORKER: Spuštění workera pro zpracování outbox eventů
    outboxWorker = new OutboxWorker({
      intervalMs: 2000,
      batchSize: 10,
      maxRetries: 3,
    });
    outboxWorker.start();

    // Logování statistik každých 30 sekund
    setInterval(async () => {
      const stats = await outboxWorker.getStats();
      console.log("[OUTBOX STATS]", stats);
    }, 30000);
  } catch (err) {
    console.error(err);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  if (outboxWorker) {
    outboxWorker.stop();
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received");
  if (outboxWorker) {
    outboxWorker.stop();
  }
  process.exit(0);
});

app.listen(3000, () => {
  console.log("Orders service listening on port 3000s.");
});

start();
