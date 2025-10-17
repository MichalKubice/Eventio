import mongoose from "mongoose";

interface TicketCacheAttrs {
  id: string; // ticketId z Tickets služby
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  ticketsAvailable: number;
  status: "scheduled" | "active" | "ended";
  startSaleAt: Date;
  version: number;
}

export interface TicketCacheDoc extends mongoose.Document {
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  ticketsAvailable: number;
  status: "scheduled" | "active" | "ended";
  startSaleAt: Date;
  version: number;
}

interface TicketCacheModel extends mongoose.Model<TicketCacheDoc> {
  build(attrs: TicketCacheAttrs): TicketCacheDoc;
  findByTicket(event: {
    id: string;
    version: number;
  }): Promise<TicketCacheDoc | null>;
}

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    totalTickets: { type: Number, required: true },
    ticketsAvailable: { type: Number, required: true },
    status: {
      type: String,
      enum: ["scheduled", "active", "ended"],
      required: true,
    },
    startSaleAt: { type: Date, required: true },
    version: { type: Number, required: true },
  },
  {
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// pro optimistic concurrency kontrolu (RabbitMQ event ordering)
ticketSchema.set("versionKey", "version");

ticketSchema.statics.findByTicket = (event: {
  id: string;
  version: number;
}) => {
  return TicketCache.findOne({
    _id: event.id,
    version: event.version - 1,
  });
};

ticketSchema.statics.build = (attrs: TicketCacheAttrs) => {
  return new TicketCache({
    _id: attrs.id,
    ...attrs,
  });
};

const TicketCache = mongoose.model<TicketCacheDoc, TicketCacheModel>(
  "TicketCache",
  ticketSchema
);

export { TicketCache };
