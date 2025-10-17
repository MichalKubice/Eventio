import express, { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import {
  validateRequest,
  NotFoundError,
  requireAuth,
  NotAuthorizedError,
} from "@mkeventio/shared";
import { Ticket } from "../models/ticket";
import { TicketUpdatedPublisher } from "../events/publishers/ticket-updated-publisher";

const router = express.Router();

router.put(
  "/api/tickets/:id",
  requireAuth,
  [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0"),
    body("description")
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage("Description is too long"),
    body("totalTickets")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Total tickets must be greater than 0"),
    body("startSaleAt")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Start sale date must be a valid date"),
    body("status")
      .optional()
      .isIn(["scheduled", "active", "ended"])
      .withMessage("Invalid status value"),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        throw new NotFoundError();
      }

      // if (ticket.orderId) {
      //   throw new BadRequestError("Cannot edit a reserved ticket");
      // }

      if (ticket.userId !== req.currentUser!.id) {
        throw new NotAuthorizedError();
      }

      const { title, description, price, totalTickets, startSaleAt, status } =
        req.body;

      ticket.set({
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price }),
        ...(totalTickets && { totalTickets }),
        ...(startSaleAt && { startSaleAt }),
        ...(status && { status }),
      });

      if (totalTickets && totalTickets < ticket.ticketsAvailable) {
        ticket.ticketsAvailable = totalTickets;
      }

      await ticket.save();

      await new TicketUpdatedPublisher().publish({
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

      res.send(ticket);
    } catch (err) {
      next(err);
    }
  }
);

export { router as updateTicketRouter };
