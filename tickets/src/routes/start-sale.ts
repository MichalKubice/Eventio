import express, { NextFunction, Request, Response } from "express";
import { requireAuth, NotFoundError, BadRequestError } from "@mkeventio/shared";
import { Ticket } from "../models/ticket";
import { TicketUpdatedPublisher } from "../events/publishers/ticket-updated-publisher";

const router = express.Router();

router.put(
  "/api/tickets/:id/start-sale",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) throw new NotFoundError();
      if (ticket.userId !== req.currentUser!.id)
        throw new BadRequestError("Not authorized");
      if (ticket.status === "active")
        throw new BadRequestError("Already active");
      if (ticket.status === "ended") throw new BadRequestError("Already ended");

      ticket.status = "active";
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

export { router as startSaleRouter };
