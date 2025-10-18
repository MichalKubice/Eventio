import { BasePublisher } from "@mkeventio/shared";

interface PaymentFailedEvent {
  orderId: string;
  reason: string;
}

export class PaymentFailedPublisher extends BasePublisher<PaymentFailedEvent> {
  exchange = "payment:failed";
}
