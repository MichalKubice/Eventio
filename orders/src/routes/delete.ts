import express, { NextFunction, Request, Response } from "express";
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError,
} from "@mkeventio/shared";
import { Order, OrderStatus } from "../models/order";
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher";

const router = express.Router();

router.delete(
  "/api/orders/:orderId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await Order.findById(req.params.orderId);
      if (!order) throw new NotFoundError();
      if (order.userId !== req.currentUser!.id) throw new NotAuthorizedError();

      order.status = OrderStatus.Cancelled;
      await order.save();

      await new OrderCancelledPublisher().publish({
        id: order.id,
        userId: order.userId,
        eventId: order.eventId,
        quantity: order.quantity,
        version: order.version,
      });

      res.status(204).send(order);
    } catch (err) {
      next(err);
    }
   
  }
);

export { router as deleteOrderRouter };
