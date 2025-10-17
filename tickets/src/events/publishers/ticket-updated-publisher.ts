import { BasePublisher } from "@mkeventio/shared";

export interface TicketUpdatedEvent {
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

export class TicketUpdatedPublisher extends BasePublisher<TicketUpdatedEvent> {
  queue = "ticket:updated";
}
