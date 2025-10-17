import { BasePublisher } from "@mkeventio/shared";

export interface OrderCreatedEvent {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  pricePerTicket: number;
  status: "created" | "awaiting:payment" | "complete" | "cancelled";
  expiresAt: string;
  version: number;
}

export class OrderCreatedPublisher extends BasePublisher<OrderCreatedEvent> {
  queue = "order:created";
}
