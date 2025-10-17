import { BaseListener } from "@mkeventio/shared";
import { EventCache } from "../../models/event-cache";

interface EventUpdatedEvent {
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

export class EventUpdatedListener extends BaseListener<EventUpdatedEvent> {
  queue = "event:updated";

  async onMessage(data: EventUpdatedEvent) {
    const event = await EventCache.findByEvent({
      id: data.id,
      version: data.version,
    });

    if (!event) {
      console.warn(`⚠️ Event not found or version mismatch: ${data.id}`);
      return;
    }

    event.set({
      title: data.title,
      description: data.description,
      price: data.price,
      totalTickets: data.totalTickets,
      ticketsAvailable: data.ticketsAvailable,
      startSaleAt: new Date(data.startSaleAt),
      status: data.status,
    });

    await event.save();

    console.log(`🔁 Event updated in Orders service cache: ${data.title}`);
  }
}
