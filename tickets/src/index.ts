import express from "express";
import { json } from "body-parser";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import { errorHandler } from "@mkeventio/shared";
import { NotFoundError, currentUser } from "@mkeventio/shared";
import {
  createTicketRouter,
  indexTicketRouter,
  showTicketRouter,
  updateTicketRouter,
} from "./routes/index";

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
    await mongoose.connect("mongodb://auth-mongo-srv:27017/auth");
    console.log("Connected to MongoDb");
  } catch (err) {
    console.error(err);
  }
};

app.listen(3000, () => {
  console.log("Ticket service listening on port 3000.");
});

start();

export { app };