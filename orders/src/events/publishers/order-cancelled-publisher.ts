import { BasePublisher } from "@mkeventio/shared";

export class OrderCancelledPublisher extends BasePublisher<any> {
  queue = "order:cancelled";
}
