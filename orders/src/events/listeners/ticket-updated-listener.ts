import { BaseListener } from "@mkeventio/shared";
import { TicketCache } from "../../models/ticket-cache";

interface TicketUpdatedEvent {
  id: string;
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  startSaleAt: string;
  status: "scheduled" | "active" | "ended";
  version: number;
}

export class TicketUpdatedListener extends BaseListener<TicketUpdatedEvent> {
  queue = "ticket:updated";

  async onMessage(data: TicketUpdatedEvent) {
    const t = await TicketCache.findById(data.id);
    if (!t) {
      console.warn(`⚠️ Ticket not in cache yet: ${data.id}`);
      return;
    }

    // Jednoduchá ochrana proti out-of-order
    if (data.version <= t.version) {
      console.warn(
        `↩️ Outdated ticket update ignored (have v${t.version}, got v${data.version})`
      );
      return;
    }

    t.set({
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

    console.log(`🔁 Ticket cache updated to v${data.version}: ${data.title}`);
  }
}
