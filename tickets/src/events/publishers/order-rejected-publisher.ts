import { BasePublisher } from "@mkeventio/shared";

export interface OrderRejectedEvent {
  orderId: string;
  reason?: string;
}

export class OrderRejectedPublisher extends BasePublisher<OrderRejectedEvent> {
  exchange = "order:rejected";
}
