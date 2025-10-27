import { BasePublisher } from "@mkeventio/shared";

export interface OrderExpiredEvent {
  orderId: string;
}

export class OrderExpiredPublisher extends BasePublisher<OrderExpiredEvent> {
  exchange = "order:expired";
}
