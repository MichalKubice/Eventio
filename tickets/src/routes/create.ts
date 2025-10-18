import express, { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import { requireAuth, validateRequest } from "@mkeventio/shared";
import { Ticket } from "../models/ticket";
import { TicketCreatedPublisher } from "../events/publishers/ticket-created-publisher";

const router = express.Router();

router.post(
  "/api/tickets",
  requireAuth,
  [
    body("title").not().isEmpty(),
    body("price").isFloat({ gt: 0 }),
    body("totalTickets").isInt({ gt: 0 }),
    body("startSaleAt").isISO8601(),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, price, totalTickets, startSaleAt } = req.body;

      const ticket = Ticket.build({
        title,
        description,
        price,
        totalTickets,
        userId: req.currentUser!.id,
        startSaleAt: new Date(startSaleAt),
        status: "scheduled",
      });
      await ticket.save(); // version = 0

      await new TicketCreatedPublisher().publish({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        price: ticket.price,
        totalTickets: ticket.totalTickets,
        soldTickets: ticket.soldTickets,
        startSaleAt: ticket.startSaleAt.toISOString(),
        status: ticket.status,
        version: ticket.version, // 0
      });

      res.status(201).send(ticket);
    } catch (err) {
      next(err);
    }
  }
);

export { router as createTicketRouter };
