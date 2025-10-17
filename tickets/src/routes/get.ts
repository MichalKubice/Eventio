import express, { NextFunction, Request, Response } from "express";
import { Ticket } from "../models/ticket";

const router = express.Router();

router.get(
  "/api/tickets",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tickets = await Ticket.find({});

      res.send(tickets);
    } catch (err) {
      next(err);
    }
  }
);

export { router as indexTicketRouter };
