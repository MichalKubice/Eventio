import { BaseListener } from "@mkeventio/shared";
import { TicketCache } from "../../models/ticket-cache";

interface TicketCreatedEvent {
  id: string;
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  ticketsAvailable: number;
  startSaleAt: string;
  status: "scheduled" | "active" | "ended";
  version: number;
}

export class TicketCreatedListener extends BaseListener<TicketCreatedEvent> {
  queue = "ticket:created";

  async onMessage(data: TicketCreatedEvent) {
    const ticket = TicketCache.build({
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      totalTickets: data.totalTickets,
      ticketsAvailable: data.ticketsAvailable,
      startSaleAt: new Date(data.startSaleAt),
      status: data.status,
      version: data.version,
    });

    await ticket.save();

    console.log(`✅ Ticket stored in Orders service cache: ${data.title}`);
  }
}
