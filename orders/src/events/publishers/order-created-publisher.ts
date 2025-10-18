import { BasePublisher } from "@mkeventio/shared";

export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  eventId: string;
  quantity: number;
  status: string; // "pending:validation"
  expiresAt: string;
  pricePerTicket: number;
  version: number;
}

export class OrderCreatedPublisher extends BasePublisher<OrderCreatedEvent> {
  exchange = "order:created";
}
