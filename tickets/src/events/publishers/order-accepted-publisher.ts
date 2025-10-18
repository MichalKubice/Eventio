import { BasePublisher } from "@mkeventio/shared";

interface OrderAcceptedEvent {
  orderId: string;
  userId: string;
  eventId: string;
  quantity: number;
  pricePerTicket: number;
  version: number;
}

export class OrderAcceptedPublisher extends BasePublisher<OrderAcceptedEvent> {
  exchange = "order:accepted";
}
