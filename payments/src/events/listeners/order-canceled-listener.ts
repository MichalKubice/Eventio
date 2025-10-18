import { BaseListener } from "@mkeventio/shared";
import { OrderCache, OrderStatus } from "../../models/order-cache";

interface OrderCancelledEvent {
  id: string;
  version: number;
}

export class OrderCancelledListener extends BaseListener<OrderCancelledEvent> {
  exchange = "order:cancelled";
  queueName = "payments-order-cancelled";

  async onMessage(data: OrderCancelledEvent) {
    try {
      const order = await OrderCache.findById(data.id);

      if (!order) {
        console.warn(`⚠️ Order not found in cache: ${data.id}`);
        return;
      }

      order.status = OrderStatus.Cancelled;
      await order.save();

      console.log(`🚫 Order ${data.id} marked as cancelled in cache`);
    } catch (err) {
      console.error("❌ Failed to process order:cancelled", err);
    }
  }
}
