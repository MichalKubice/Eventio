import { BasePublisher } from "@mkeventio/shared";

interface PaymentFailedEvent {
  orderId: string;
  reason: string;
}

export class PaymentFailedPublisher extends BasePublisher<PaymentFailedEvent> {
  queue = "payment:failed";
}
