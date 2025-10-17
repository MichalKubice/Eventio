import { BasePublisher } from "@mkeventio/shared";

export class OrderCreatedPublisher extends BasePublisher<any> {
  queue = "order:created";
}
