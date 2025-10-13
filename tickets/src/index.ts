import express from "express";
import { json } from "body-parser";
import mongoose from "mongoose";

import { errorHandler } from "@mkeventio/shared";
import { NotFoundError } from "@mkeventio/shared";

const app = express();
app.use(json());

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
  console.log("Auth service listening on port 3000.");
});

start();
