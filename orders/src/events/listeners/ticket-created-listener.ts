import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";

export class TicketCreatedListener extends BaseListener<any> {
  queue = "ticket:created";

  async onMessage(data: any) {
    const ticket = Ticket.build({
      id: data.id,
      title: data.title,
      price: data.price,
    });
    await ticket.save();

    console.log("✅ Ticket stored in orders service:", data.title);
  }
}
