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
import axios from "axios";

const router = express.Router();

const EXPIRATION_WINDOW_SECONDS = 15 * 60;
const TICKETS_SERVICE_URL =
  process.env.TICKETS_SERVICE_URL || "http://tickets-srv:3000";

// SYNCHRONNÍ vytvoření objednávky s HTTP API voláním
router.post(
  "/api/orders/sync",
  requireAuth,
  [
    body("ticketId")
      .custom((id: string) => mongoose.Types.ObjectId.isValid(id))
      .withMessage("Valid ticketId is required"),
    body("quantity").isInt({ gt: 0 }).withMessage("Quantity must be > 0"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    try {
      const { ticketId, quantity } = req.body;

      // 1. Načti ticket z cache
      const ticket = await TicketCache.findById(ticketId);
      if (!ticket) throw new NotFoundError();
      if (ticket.status !== "active")
        throw new BadRequestError("Ticket sale not active");

      const expiresAt = new Date(Date.now() + EXPIRATION_WINDOW_SECONDS * 1000);

      // 2. Vytvoř objednávku (zatím bez validace)
      const order = Order.build({
        userId: req.currentUser!.id,
        eventId: ticket.id,
        quantity,
        pricePerTicket: ticket.price,
        expiresAt,
        status: OrderStatus.PendingValidation,
      });
      await order.save();

      console.log(`[SYNC] Order ${order.id} created, calling Tickets service...`);

      // 3. SYNCHRONNÍ volání do Tickets service pro validaci
      try {
        const validationResponse = await axios.post(
          `${TICKETS_SERVICE_URL}/api/tickets/validate-order`,
          {
            orderId: order.id,
            ticketId: ticket.id,
            quantity,
            expiresAt: expiresAt.toISOString(),
          },
          {
            timeout: 5000, // 5s timeout
          }
        );

        if (!validationResponse.data.success) {
          // Validace selhala
          order.status = OrderStatus.Cancelled;
          await order.save();

          const duration = Date.now() - startTime;
          console.log(
            `[SYNC] Order ${order.id} rejected: ${validationResponse.data.reason} (${duration}ms)`
          );

          return res.status(400).json({
            error: validationResponse.data.message,
            reason: validationResponse.data.reason,
            duration: `${duration}ms`,
          });
        }

        // Validace úspěšná
        order.status = OrderStatus.AwaitingPayment;
        await order.save();

        const duration = Date.now() - startTime;
        console.log(
          `[SYNC] Order ${order.id} accepted (${duration}ms) - SYNCHRONOUS`
        );

        res.status(201).json({
          ...order.toJSON(),
          communicationType: "SYNCHRONOUS",
          duration: `${duration}ms`,
        });
      } catch (apiError: any) {
        // Chyba při volání Tickets service
        console.error(
          `[SYNC] Failed to call Tickets service:`,
          apiError.message
        );

        order.status = OrderStatus.Cancelled;
        await order.save();

        const duration = Date.now() - startTime;

        throw new BadRequestError(
          `Tickets service unavailable: ${apiError.message} (${duration}ms)`
        );
      }
    } catch (err) {
      next(err);
    }
  }
);

export { router as createOrderSyncRouter };
