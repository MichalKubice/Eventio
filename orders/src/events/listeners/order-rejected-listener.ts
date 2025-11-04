import { BaseListener } from "@mkeventio/shared";
import { Order, OrderStatus } from "../../models/order";

interface OrderRejectedEvent {
  orderId: string;
  reason?: string;
}

export class OrderRejectedListener extends BaseListener<OrderRejectedEvent> {
  exchange = "order:rejected";
  queueName = "orders-order-rejected";

  async onMessage(data: OrderRejectedEvent) {
    const order = await Order.findById(data.orderId);
    if (!order) throw new Error("Order not found");
    order.status = OrderStatus.Cancelled;
    await order.save();
    console.log(
      `Order ${order.id} cancelled (reason=${data.reason || "n/a"})`
    );
  }
}
