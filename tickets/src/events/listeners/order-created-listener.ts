import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { TicketCreatedPublisher } from "../publishers/ticket-created-publisher";

export class OrderCreatedListener extends BaseListener<any> {
  queue = "order:created";

  async onMessage(data: any) {
    const ticket = await Ticket.findById(data.ticket.id);
    if (!ticket) throw new Error("Ticket not found");

    ticket.set({ orderId: data.id });
    await ticket.save();

    await new TicketCreatedPublisher().publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
    });

    console.log("✅ Ticket reserved by order:", data.id);
  }
}
