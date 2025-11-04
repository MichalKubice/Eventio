import { BaseListener } from "@mkeventio/shared";
import { Order, OrderStatus } from "../../models/order";
import { OrderCancelledPublisher } from "../publishers/order-cancelled-publisher";

interface OrderExpiredEvent {
  orderId: string;
}

export class OrderExpiredListener extends BaseListener<OrderExpiredEvent> {
  exchange = "order:expired";
  queueName = "orders-order-expired";

  async onMessage(data: OrderExpiredEvent) {
    const order = await Order.findById(data.orderId);

    if (!order) {
      console.warn(`Order not found for expired ID ${data.orderId}`);
      return;
    }

    if (order.status === OrderStatus.Complete) {
      console.log(`Order ${order.id} already completed – ignoring expiry`);
      return;
    }

    order.status = OrderStatus.Cancelled;
    await order.save();

    // await new OrderCancelledPublisher().publish({
    //   id: order.id,
    //   userId: order.userId,
    //   eventId: order.eventId,
    //   quantity: order.quantity,
    //   version: order.version,
    // });

    console.log(`Order ${order.id} expired and marked as cancelled`);
  }
}
