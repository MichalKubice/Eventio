import { BasePublisher } from "@mkeventio/shared";
export class TicketUpdatedPublisher extends BasePublisher<any> {
  queue = "ticket:updated";
}
