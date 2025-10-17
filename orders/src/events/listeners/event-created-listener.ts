import { BaseListener } from "@mkeventio/shared";
import { EventCache } from "../../models/event-cache";

interface EventCreatedEvent {
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

export class EventCreatedListener extends BaseListener<EventCreatedEvent> {
  queue = "event:created";

  async onMessage(data: EventCreatedEvent) {
    const event = EventCache.build({
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

    await event.save();

    console.log(`✅ Event stored in Orders service cache: ${data.title}`);
  }
}
