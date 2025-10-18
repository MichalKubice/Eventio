import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { OrderAcceptedPublisher } from "../publishers/order-accepted-publisher";
import { OrderRejectedPublisher } from "../publishers/order-rejected-publisher";

interface OrderCreatedEvent {
  id: string;
  userId: string;
  eventId: string; // ticketId
  quantity: number;
  expiresAt: string;
  version: number;
}

export class OrderCreatedListener extends BaseListener<OrderCreatedEvent> {
  queue = "order:created";

  async onMessage(data: OrderCreatedEvent) {
    const ticket = await Ticket.findById(data.eventId);
    if (!ticket) throw new Error("Ticket not found");

    // Bez Redis: jen pevná kontrola na základě prodaných kusů
    const available = ticket.ticketsAvailable();
    if (ticket.status === "active" && available >= data.quantity) {
      // přijmout (rezervace doplníme přes Redis později)
      await new OrderAcceptedPublisher().publish({ orderId: data.id });
      console.log(`✅ Order accepted by Tickets (${data.id})`);
    } else {
      await new OrderRejectedPublisher().publish({
        orderId: data.id,
        reason: "not_enough_tickets",
      });
      console.log(`❌ Order rejected by Tickets (${data.id})`);
    }
  }
}
