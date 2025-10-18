import express, { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import {
  requireAuth,
  validateRequest,
  NotFoundError,
  NotAuthorizedError,
} from "@mkeventio/shared";
import { Ticket } from "../models/ticket";
import { TicketUpdatedPublisher } from "../events/publishers/ticket-updated-publisher";

const router = express.Router();

router.put(
  "/api/tickets/:id",
  requireAuth,
  [
    body("title").optional().not().isEmpty(),
    body("price").optional().isFloat({ gt: 0 }),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) throw new NotFoundError();
      if (ticket.userId !== req.currentUser!.id) throw new NotAuthorizedError();

      const { title, description, price } = req.body;
      if (title !== undefined) ticket.title = title;
      if (description !== undefined) ticket.description = description;
      if (price !== undefined) ticket.price = price;

      await ticket.save();

      await new TicketUpdatedPublisher().publish({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        price: ticket.price,
        totalTickets: ticket.totalTickets,
        soldTickets: ticket.soldTickets,
        startSaleAt: ticket.startSaleAt.toISOString(),
        status: ticket.status,
        version: ticket.version,
      });

      res.send(ticket);
    } catch (err) {
      next(err);
    }
  }
);

export { router as updateTicketRouter };
