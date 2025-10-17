import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

interface OrderCancelledEvent {
  id: string;
  eventId: string;
  quantity: number;
}

export class OrderCancelledListener extends BaseListener<OrderCancelledEvent> {
  queue = "order:cancelled";

  async onMessage(data: OrderCancelledEvent) {
    const ticket = await Ticket.findById(data.eventId);

    if (!ticket) {
      throw new Error("Event not found");
    }

    ticket.ticketsAvailable += data.quantity;

    if (ticket.ticketsAvailable > ticket.totalTickets) {
      ticket.ticketsAvailable = ticket.totalTickets;
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

    console.log(
      `Objednávka ${data.id} zrušena, uvolněno ${data.quantity} lístků. Dostupných nyní: ${ticket.ticketsAvailable}.`
    );
  }
}
