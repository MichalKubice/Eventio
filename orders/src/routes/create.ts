import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { body } from "express-validator";
import {
  requireAuth,
  validateRequest,
  NotFoundError,
  BadRequestError,
} from "@mkeventio/shared";
import { Order, OrderStatus } from "../models/order";
import { TicketCache } from "../models/ticket-cache";
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher";

const router = express.Router();
const EXPIRATION_WINDOW_SECONDS = 15 * 60; // 15 minut

router.post(
  "/api/orders",
  requireAuth,
  [
    body("eventId")
      .not()
      .isEmpty()
      .custom((id: string) => mongoose.Types.ObjectId.isValid(id))
      .withMessage("Valid eventId must be provided"),
    body("quantity")
      .isInt({ gt: 0 })
      .withMessage("Quantity must be greater than 0"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventId, quantity } = req.body;

      const event = await TicketCache.findById(eventId);
      if (!event) throw new NotFoundError();

      if (event.status !== "active") {
        throw new BadRequestError("Event is not available for sale");
      }
      if (event.ticketsAvailable < quantity) {
        throw new BadRequestError("Not enough tickets available");
      }

      const expiration = new Date();
      expiration.setSeconds(
        expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS
      );

      const order = Order.build({
        userId: req.currentUser!.id,
        status: OrderStatus.Created,
        expiresAt: expiration,
        eventId: event.id,
        quantity,
        pricePerTicket: event.price,
      });
      await order.save();

      await new OrderCreatedPublisher().publish({
        id: order.id,
        userId: order.userId,
        eventId: order.eventId,
        quantity: order.quantity,
        status: order.status,
        expiresAt: order.expiresAt.toISOString(),
        pricePerTicket: order.pricePerTicket,
        version: order.version,
      });

      res.status(201).send(order);
    } catch (err) {
      next(err);
    }
  }
);

export { router as createOrderRouter };
