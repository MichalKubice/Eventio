import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";
import { TicketCreatedPublisher } from "../publishers/ticket-created-publisher";

export class OrderCancelledListener extends BaseListener<any> {
  queue = "order:cancelled";

  async onMessage(data: any) {
    const ticket = await Ticket.findById(data.ticket.id);
    if (!ticket) throw new Error("Ticket not found");

    ticket.set({ orderId: undefined });
    await ticket.save();

    await new TicketCreatedPublisher().publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
    });

    console.log("✅ Ticket unreserved:", data.ticket.id);
  }
}
