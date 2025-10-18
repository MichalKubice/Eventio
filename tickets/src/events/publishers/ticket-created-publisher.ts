import { BasePublisher } from "@mkeventio/shared";

export interface TicketCreatedEvent {
  id: string;
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  startSaleAt: string;
  status: "scheduled" | "active" | "ended";
  version: number;
}

export class TicketCreatedPublisher extends BasePublisher<TicketCreatedEvent> {
  exchange = "ticket:created";
}
