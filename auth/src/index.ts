import express from "express";
import { json } from "body-parser";
import mongoose from "mongoose";
import cookieSession from "cookie-session";

import {
  currentUserRouter,
  signinRouter,
  signoutRouter,
  signupRouter,
} from "./routes/index";

import { errorHandler } from "@mkeventio/shared";
import { NotFoundError } from "@mkeventio/shared";

const app = express();
app.set("trust proxy", true);
app.use(json());

app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

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
      throw new Error("MONGO_URI must be defined");
    } 
    await mongoose.connect("mongodb://auth-mongo-srv:27017/auth");
    console.log("Connected to MongoDb");
  } catch (err) {
    console.error(err);
  }
};

app.listen(3000, () => {
  console.log("Auth service listening on port 3000.");
});

start();
