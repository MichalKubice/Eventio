import { BasePublisher } from "@mkeventio/shared";

export interface OrderCancelledEvent {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  version: number;
}

export class OrderCancelledPublisher extends BasePublisher<OrderCancelledEvent> {
  exchange = "order:cancelled";
}
