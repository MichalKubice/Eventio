import { BaseListener } from "@mkeventio/shared";
import { Order, OrderStatus } from "../../models/order";

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
  queueName = "orders-order-accepted";

  async onMessage(data: OrderAcceptedEvent) {
    const order = await Order.findById(data.orderId);
    if (!order) throw new Error("Order not found");
    order.status = OrderStatus.AwaitingPayment;
    await order.save();
    console.log(`Order ${order.id} moved to awaiting:payment`);
  }
}
