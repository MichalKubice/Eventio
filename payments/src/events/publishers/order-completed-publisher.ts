import { BasePublisher } from "@mkeventio/shared";

interface OrderCompletedEvent {
  id: string;
  eventId: string;
  userId: string;
  paymentId: string;
  quantity: number;
}

export class OrderCompletedPublisher extends BasePublisher<OrderCompletedEvent> {
  queue = "order:completed";
}
