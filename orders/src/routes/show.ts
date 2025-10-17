import express, { NextFunction, Request, Response } from "express";
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from "@mkeventio/shared";
import { Order } from "../models/order";

const router = express.Router();

router.get(
  "/api/orders/:orderId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await Order.findById(req.params.orderId);

      if (!order) {
        throw new NotFoundError();
      }
      if (order.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError();
      }

      res.send(order);
    } catch (err) {
      next(err);
    }
  }
);

export { router as showOrderRouter };
