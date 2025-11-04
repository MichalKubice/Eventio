import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";
import { releaseTickets } from "@mkeventio/shared";

interface OrderCompletedEvent {
  orderId: string;
  eventId: string; // ticketId
  quantity: number;
  version: number;
}

export class OrderCompletedListener extends BaseListener<OrderCompletedEvent> {
  exchange = "order:completed";
  queueName = "tickets-order-completed";

  async onMessage(data: OrderCompletedEvent) {
    try {
      const ticket = await Ticket.findById(data.eventId);
      if (!ticket) {
        console.warn(`Ticket not found for completed order ${data.orderId}`);
        return;
      }

      await releaseTickets(data.orderId, data.eventId, data.quantity);

      ticket.soldTickets += data.quantity;

      if (ticket.soldTickets > ticket.totalTickets) {
        console.warn(
          `Oversell detected for ticket ${ticket.id}, correcting`
        );
        ticket.soldTickets = ticket.totalTickets;
      }

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

      console.log(
        `Finalized sale of ${data.quantity} ticket(s) for ${ticket.id}, new sold=${ticket.soldTickets}`
      );
    } catch (err) {
      console.error("Error processing order:completed", err);
    }
  }
}
