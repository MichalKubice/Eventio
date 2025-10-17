import { BasePublisher } from "@mkeventio/shared";

export interface TicketCreatedEvent {
  id: string;
  title: string;
  description?: string;
  price: number;
  userId: string;
  totalTickets: number;
  ticketsAvailable: number;
  startSaleAt: string;
  status: "scheduled" | "active" | "ended";
  version: number;
}

export class TicketCreatedPublisher extends BasePublisher<TicketCreatedEvent> {
  queue = "ticket:created";
}
