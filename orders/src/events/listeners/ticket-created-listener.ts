import { BaseListener } from "@mkeventio/shared";
import { TicketCache } from "../../models/ticket-cache";

interface TicketCreatedEvent {
  id: string;
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  startSaleAt: string;
  status: "scheduled" | "active" | "ended";
  version: number; // 0
}

export class TicketCreatedListener extends BaseListener<TicketCreatedEvent> {
  queue = "ticket:created";

  async onMessage(data: TicketCreatedEvent) {
    const t = TicketCache.build({
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      totalTickets: data.totalTickets,
      soldTickets: data.soldTickets,
      startSaleAt: new Date(data.startSaleAt),
      status: data.status,
      version: data.version,
    });
    await t.save();
    console.log(`🗂️ Ticket cached (Orders): ${data.title}`);
  }
}
