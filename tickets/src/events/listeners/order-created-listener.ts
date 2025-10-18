import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { OrderAcceptedPublisher } from "../publishers/order-accepted-publisher";
import { OrderRejectedPublisher } from "../publishers/order-rejected-publisher";

interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  eventId: string; // ticketId
  quantity: number;
  expiresAt: string;
  version: number;
}

export class OrderCreatedListener extends BaseListener<OrderCreatedEvent> {
  exchange = "order:created";
  queueName = "tickets-order-created";

  async onMessage(data: OrderCreatedEvent) {
    const ticket = await Ticket.findById(data.eventId);
    if (!ticket) throw new Error("Ticket not found");

    // Bez Redis: jen pevná kontrola na základě prodaných kusů
    const available = ticket.ticketsAvailable();
    if (ticket.status === "active" && available >= data.quantity) {
      // přijmout (rezervace doplníme přes Redis později)
      await new OrderAcceptedPublisher().publish({
        orderId: data.orderId,
        eventId: ticket.id,
        userId: data.userId,
        quantity: data.quantity,
        pricePerTicket: ticket.price,
        version: data.version,
      });
      console.log(`✅ Order accepted by Tickets (${data.orderId})`);
    } else {
      await new OrderRejectedPublisher().publish({
        orderId: data.orderId,
        reason: "not_enough_tickets",
      });
      console.log(`❌ Order rejected by Tickets (${data.orderId})`);
    }
  }
}
