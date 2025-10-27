import { BaseListener } from "@mkeventio/shared";
import { releaseAllForOrder } from "@mkeventio/shared";

interface OrderCancelledEvent {
  orderId: string;
  eventId: string; // ticketId
  quantity: number;
  version: number;
}

export class OrderCancelledListener extends BaseListener<OrderCancelledEvent> {
  exchange = "order:cancelled";
  queueName = "tickets-order-cancelled";

  async onMessage(data: OrderCancelledEvent) {
    try {
      await releaseAllForOrder(data.orderId);

      console.log(
        `🚫 Released Redis reservations for cancelled order ${data.orderId} (ticket ${data.eventId})`
      );
    } catch (err) {
      console.error(
        `❌ Failed to release reservations for order ${data.orderId}`,
        err
      );
    }
  }
}
