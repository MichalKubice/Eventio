import { BasePublisher } from "@mkeventio/shared";

export interface TicketUpdatedEvent {
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

export class TicketUpdatedPublisher extends BasePublisher<TicketUpdatedEvent> {
  queue = "ticket:updated";
}
