import express, { NextFunction, Request, Response } from "express";
import { requireAuth, NotFoundError, BadRequestError } from "@mkeventio/shared";
import { Ticket } from "../models/ticket";
import { TicketUpdatedPublisher } from "../events/publishers/ticket-updated-publisher";
import { rabbitWrapper } from "@mkeventio/shared";

const router = express.Router();

router.put(
  "/api/tickets/:id/start-sale",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        throw new NotFoundError();
      }

      if (ticket.userId !== req.currentUser!.id) {
        throw new BadRequestError("Not authorized to start this sale");
      }

      if (ticket.status === "active") {
        throw new BadRequestError("Sale already active");
      }

      if (ticket.status === "ended") {
        throw new BadRequestError("Sale has already ended");
      }

      // Change status to active
      ticket.status = "active";
      await ticket.save();

      // Publish event to inform other services
      await new TicketUpdatedPublisher().publish({
        id: ticket.id,
        title: ticket.title,
        userId: ticket.userId,
        description: ticket.description,
        price: ticket.price,
        totalTickets: ticket.totalTickets,
        ticketsAvailable: ticket.ticketsAvailable,
        startSaleAt: ticket.startSaleAt.toISOString(),
        status: ticket.status,
        version: ticket.version,
      });

      console.log(`🚀 Ticket sale started: ${ticket.title}`);

      res.status(200).send(ticket);
    } catch (err) {
      next(err);
    }
  }
);

export { router as startSaleRouter };
