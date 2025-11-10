import express, { Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { validateRequest, NotFoundError, BadRequestError } from "@mkeventio/shared";
import { Ticket } from "../models/ticket";
import { reserveTickets, getReservedCount } from "@mkeventio/shared";

const router = express.Router();

// SYNCHRONNÍ ENDPOINT pro validaci objednávky
router.post(
  "/api/tickets/validate-order",
  [
    body("orderId").notEmpty().withMessage("Order ID is required"),
    body("ticketId").notEmpty().withMessage("Ticket ID is required"),
    body("quantity").isInt({ gt: 0 }).withMessage("Quantity must be > 0"),
    body("expiresAt").isISO8601().withMessage("Valid expiration date required"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId, ticketId, quantity, expiresAt } = req.body;

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        throw new NotFoundError();
      }

      // Validace stavu
      if (ticket.status !== "active") {
        return res.status(400).json({
          success: false,
          reason: "ticket_not_active",
          message: "Ticket sale is not active",
        });
      }

      // Kontrola dostupnosti
      const reserved = await getReservedCount(ticket.id);
      const availableNow = ticket.totalTickets - ticket.soldTickets - reserved;

      if (availableNow < quantity) {
        return res.status(400).json({
          success: false,
          reason: "not_enough_tickets",
          message: `Not enough tickets available. Requested: ${quantity}, Available: ${availableNow}`,
          available: availableNow,
        });
      }

      // Rezervuj lístky v Redis
      const expiresInSec = Math.floor(
        (new Date(expiresAt).getTime() - Date.now()) / 1000
      );

      await reserveTickets(orderId, ticketId, quantity, expiresInSec);

      console.log(
        `[SYNC] Order ${orderId} validated and reserved ${quantity} tickets`
      );

      // Úspěšná validace
      res.status(200).json({
        success: true,
        orderId,
        ticketId: ticket.id,
        quantity,
        pricePerTicket: ticket.price,
        totalPrice: ticket.price * quantity,
        expiresInSec,
      });
    } catch (err) {
      next(err);
    }
  }
);

export { router as validateOrderRouter };
