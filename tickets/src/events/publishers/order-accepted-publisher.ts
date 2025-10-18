import { BasePublisher } from "@mkeventio/shared";

export interface OrderAcceptedEvent {
  orderId: string;
}

export class OrderAcceptedPublisher extends BasePublisher<OrderAcceptedEvent> {
  queue = "order:accepted";
}
