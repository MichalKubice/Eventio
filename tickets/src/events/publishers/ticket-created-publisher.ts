import { BasePublisher } from "@mkeventio/shared";

interface TicketCreatedEvent {
  id: string;
  title: string;
  price: number;
  userId: string;
}

export class TicketCreatedPublisher extends BasePublisher<TicketCreatedEvent> {
  queue = "ticket:created";
}
