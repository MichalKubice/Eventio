import { BaseListener } from "@mkeventio/shared";
import { Ticket } from "../../models/ticket";

export class TicketUpdatedListener extends BaseListener<any> {
  queue = "ticket:updated";

  async onMessage(data: any) {
    const ticket = await Ticket.findById(data.id);
    if (!ticket) throw new Error("Ticket not found");

    ticket.set({ title: data.title, price: data.price });
    await ticket.save();

    console.log("✅ Ticket updated in orders service:", data.id);
  }
}
