import { BaseListener } from "@mkeventio/shared";
import { Order, OrderStatus } from "../../models/order";

interface OrderCompletedEvent {
  id: string;
  userId: string;
  paymentId: string;
  eventId: string;
  quantity: number;
}

export class OrderCompletedListener extends BaseListener<OrderCompletedEvent> {
  exchange = "order:completed";
  queueName = "orders-order-completed";

  async onMessage(data: OrderCompletedEvent) {
    const order = await Order.findById(data.id);
    if (!order) {
      console.warn(`⚠️ Order not found for id: ${data.id}`);
      return;
    }

    if (order.status === OrderStatus.Complete) {
      console.log(`⚠️ Order ${data.id} already marked as complete`);
      return;
    }

    order.status = OrderStatus.Complete;
    await order.save();

    console.log(`✅ Order ${order.id} marked as complete (after payment)`);
  }
}
