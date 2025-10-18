import { BaseListener } from "@mkeventio/shared";

// Bez Redis zatím není co dělat: zrušení pending nemění soldTickets.
interface OrderCancelledEvent {
  id: string;
  eventId: string;
  quantity: number;
  version: number;
}

export class OrderCancelledListener extends BaseListener<OrderCancelledEvent> {
  exchange = "order:cancelled";
  queueName = "tickets-order-cancelled";
  async onMessage(_data: OrderCancelledEvent) {
    // no-op zatím (až bude Redis, vrátíme rezervace)
    console.log("ℹ️ Order cancelled (Tickets noop for now).");
  }
}
