import { BaseListener } from "@mkeventio/shared";
import { Payment, PaymentStatus } from "../../models/payment";

interface OrderRejectedEvent {
  id: string;
  userId: string;
}

export class OrderRejectedListener extends BaseListener<OrderRejectedEvent> {
  exchange = "order:rejected";
  queueName = "payments-order-rejected";

  async onMessage(data: OrderRejectedEvent) {
    const payments = await Payment.find({ orderId: data.id });
    for (const p of payments) {
      if (p.status === "succeeded") {
        p.status = PaymentStatus.Refunded;
        await p.save();

        //sending money back
        console.log(`Auto-refund payment for rejected order ${data.id}`);
      }
    }
  }
}
