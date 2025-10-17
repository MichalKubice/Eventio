import express, { NextFunction, Request, Response } from "express";
import { requireAuth } from "@mkeventio/shared";
import { Order } from "../models/order";

const router = express.Router();

router.get(
  "/api/orders",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await Order.find({
        userId: req.currentUser!.id,
      });

      res.send(orders);
    } catch (err) {
      next(err);
    }
  }
);

export { router as indexOrderRouter };
