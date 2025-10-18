import { BasePublisher } from "@mkeventio/shared";

export interface OrderCompletedEvent {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  version: number;
}

export class OrderCompletedPublisher extends BasePublisher<OrderCompletedEvent> {
  queue = "order:completed";
}
