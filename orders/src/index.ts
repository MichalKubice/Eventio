import express from "express";
import { json } from "body-parser";
import mongoose from "mongoose";
import cookieSession from "cookie-session";

import { errorHandler } from "@mkeventio/shared";
import { NotFoundError } from "@mkeventio/shared";

import { deleteOrderRouter, newOrderRouter, indexOrderRouter, showOrderRouter } from "./routes/index";

import { rabbitWrapper } from "@mkeventio/shared";
import { TicketCreatedListener } from "./events/listeners/ticket-created-listener";
import { TicketUpdatedListener } from "./events/listeners/ticket-updated-listener";

const app = express();
app.set("trust proxy", true);
app.use(json());

app.use(newOrderRouter);
app.use(indexOrderRouter);
app.use(showOrderRouter);
app.use(deleteOrderRouter);

app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.all("*", (req, res, next) => {
  next(new NotFoundError());
});

app.use(errorHandler);

const start = async () => {
  try {
    if (!process.env.JWT_KEY) {
      throw new Error("JWT_KEY must be defined");
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI must be defined");
    }

    if (!process.env.RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL must be defined");
    }

    await rabbitWrapper.connect(process.env.RABBITMQ_URL);
    console.log("Connected to RabbitMQ!");
    await mongoose.connect("mongodb://orders-mongo-srv:27017/orders");
    console.log("Connected to MongoDb");
    new TicketCreatedListener().listen();
    new TicketUpdatedListener().listen();
  } catch (err) {
    console.error(err);
  }
};

app.listen(3000, () => {
  console.log("Auth service listening on port 3000.");
});

start();
