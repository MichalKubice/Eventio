import mongoose from "mongoose";
import express, { NextFunction, Request, Response } from "express";
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

const EXPIRATION_WINDOW_SECONDS = 15 * 60;

router.post(
  "/api/orders",
  requireAuth,
  [
    body("ticketId")
      .custom((id: string) => mongoose.Types.ObjectId.isValid(id))
      .withMessage("Valid ticketId is required"),
    body("quantity").isInt({ gt: 0 }).withMessage("Quantity must be > 0"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ticketId, quantity } = req.body;

      const ticket = await TicketCache.findById(ticketId);
      if (!ticket) throw new NotFoundError();
      if (ticket.status !== "active")
        throw new BadRequestError("Ticket sale not active");

      const expiresAt = new Date(Date.now() + EXPIRATION_WINDOW_SECONDS * 1000);

      const order = Order.build({
        userId: req.currentUser!.id,
        eventId: ticket.id,
        quantity,
        pricePerTicket: ticket.price, // snapshot ceny
        expiresAt,
        status: OrderStatus.PendingValidation,
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
