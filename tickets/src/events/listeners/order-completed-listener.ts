import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

interface OrderCompletedEvent {
  id: string;
  eventId: string;   // ticketId
  quantity: number;
  version: number;
}

export class OrderCompletedListener extends BaseListener<OrderCompletedEvent> {
  queue = "order:completed";

  async onMessage(data: OrderCompletedEvent) {
    const ticket = await Ticket.findById(data.eventId);
    if (!ticket) throw new Error("Ticket not found");

    ticket.soldTickets += data.quantity;
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

    console.log(`💰 Sold ${data.quantity} (ticket ${ticket.id}), version=${ticket.version}`);
  }
}
