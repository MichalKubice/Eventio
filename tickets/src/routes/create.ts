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
    body("title").not().isEmpty().withMessage("Title is required"),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0"),
    body("totalTickets")
      .isInt({ gt: 0 })
      .withMessage("Total tickets must be greater than 0"),
    body("startSaleAt")
      .isISO8601()
      .toDate()
      .withMessage("Start sale date must be a valid date"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Description is too longs"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, price, description, totalTickets, startSaleAt } = req.body;

      const ticket = Ticket.build({
        title,
        description,
        price,
        userId: req.currentUser!.id,
        totalTickets,
        startSaleAt,
        ticketsAvailable: totalTickets,
        status: "scheduled",
      });

      await ticket.save();

      await new TicketCreatedPublisher().publish({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        price: ticket.price,
        userId: ticket.userId,
        totalTickets: ticket.totalTickets,
        ticketsAvailable: ticket.ticketsAvailable,
        startSaleAt: ticket.startSaleAt.toISOString(),
        status: ticket.status,
        version: ticket.version,
      });

      res.status(201).send(ticket);
    } catch (err) {
      next(err);
    }
  }
);

export { router as createTicketRouter };
