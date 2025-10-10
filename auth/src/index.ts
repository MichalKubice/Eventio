import express from "express";
import { json } from "body-parser";

import {
  currentUserRouter,
  signinRouter,
  signoutRouter,
  signupRouter,
} from "./routes/index";
import { errorHandler } from "./middlewares/error-handler";
import { NotFoundError } from "./errors/not-found-error";

const app = express();
app.use(json());

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

app.all("*", (req, res, next) => {
  next(new NotFoundError());
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log("Auth service listening on port 3000.");
});
