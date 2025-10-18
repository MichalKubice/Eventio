import { BaseListener } from "@mkeventio/shared";
import { OrderCache, OrderStatus } from "../../models/order-cache";

interface OrderAcceptedEvent {
  orderId: string;
  userId: string;
  eventId: string;
  quantity: number;
  pricePerTicket: number;
  version: number;
}

export class OrderAcceptedListener extends BaseListener<OrderAcceptedEvent> {
  exchange = "order:accepted";
  queueName = "payments-order-accepted";

  async onMessage(data: OrderAcceptedEvent) {
    const existing = await OrderCache.findById(data.orderId);
    if (existing) {
      console.log(`⚠️ Order already cached: ${data.orderId}`);
      return;
    }

    const order = OrderCache.build({
      id: data.orderId,
      userId: data.userId,
      eventId: data.eventId,
      quantity: data.quantity,
      pricePerTicket: data.pricePerTicket,
      status: OrderStatus.AwaitingPayment,
    });

    await order.save();

    console.log(`💰 Cached accepted order ${data.orderId}, ready for payment`);
  }
}
