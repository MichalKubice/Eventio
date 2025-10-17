import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

interface OrderCreatedEvent {
  id: string;
  eventId: string;
  quantity: number;
}

export class OrderCreatedListener extends BaseListener<OrderCreatedEvent> {
  queue = "order:created";

  async onMessage(data: OrderCreatedEvent) {
    const ticket = await Ticket.findById(data.eventId);

    if (!ticket) {
      throw new Error("Event not found");
    }

    if (ticket.ticketsAvailable < data.quantity) {
      console.warn(
        `⚠️ Nedostatek lístků pro event ${ticket.id}. Zbývá ${ticket.ticketsAvailable}, požadováno ${data.quantity}`
      );
      return;
    }

    ticket.ticketsAvailable -= data.quantity;
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

    console.log(
      `✅ Lístky rezervovány (${data.quantity}) pro objednávku ${data.id}. Zbývá ${ticket.ticketsAvailable}.`
    );
  }
}
