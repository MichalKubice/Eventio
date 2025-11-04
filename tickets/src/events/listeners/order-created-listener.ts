import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { OrderAcceptedPublisher } from "../publishers/order-accepted-publisher";
import { OrderRejectedPublisher } from "../publishers/order-rejected-publisher";
import { reserveTickets } from "@mkeventio/shared";
import { getReservedCount } from "@mkeventio/shared";

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
    try {
      const ticket = await Ticket.findById(data.eventId);
      if (!ticket) throw new Error("Ticket not found");

      if (ticket.status !== "active") {
        await new OrderRejectedPublisher().publish({
          orderId: data.orderId,
          reason: "ticket_not_active",
        });
        console.log(`Order rejected — ticket not active (${data.orderId})`);
        return;
      }

      const reserved = await getReservedCount(ticket.id);
      const availableNow = ticket.totalTickets - ticket.soldTickets - reserved;

      if (availableNow < data.quantity) {
        await new OrderRejectedPublisher().publish({
          orderId: data.orderId,
          reason: "not_enough_tickets",
        });
        console.log(
          `Order rejected by Tickets (${data.orderId}) — insufficient tickets`
        );
        return;
      }

      const expiresInSec = Math.floor(
        (new Date(data.expiresAt).getTime() - Date.now()) / 1000
      );

      await reserveTickets(
        data.orderId,
        data.eventId,
        data.quantity,
        expiresInSec
      );

      await new OrderAcceptedPublisher().publish({
        orderId: data.orderId,
        eventId: ticket.id,
        userId: data.userId,
        quantity: data.quantity,
        pricePerTicket: ticket.price,
        version: data.version,
      });

      console.log(
        `Order accepted and reserved ${data.quantity} tickets (${data.orderId}) — TTL ${expiresInSec}s`
      );
    } catch (err) {
      console.error("Error in OrderCreatedListener", err);
    }
  }
}
