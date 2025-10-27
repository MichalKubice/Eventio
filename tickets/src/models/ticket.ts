import mongoose from "mongoose";
import { getReservedCount } from "@mkeventio/shared";

export const computeAvailableNow = async (
  ticket: TicketDoc
): Promise<number> => {
  const reserved = await getReservedCount(ticket.id);
  return Math.max(ticket.totalTickets - ticket.soldTickets - reserved, 0);
};


export interface TicketAttrs {
  title: string;
  description?: string;
  price: number;
  userId: string;
  totalTickets: number;
  startSaleAt: Date;
  status?: "scheduled" | "active" | "ended";
}

export interface TicketDoc extends mongoose.Document {
  title: string;
  description?: string;
  price: number;
  userId: string;
  totalTickets: number;
  soldTickets: number; // klíčové – prodané kusy
  startSaleAt: Date;
  status: "scheduled" | "active" | "ended";
  version: number;
  ticketsAvailable(): number; // vypočet dostupných (bez Redis)
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
}

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    userId: { type: String, required: true },
    totalTickets: { type: Number, required: true, min: 1 },
    soldTickets: { type: Number, required: true, default: 0, min: 0 },
    startSaleAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "active", "ended"],
      default: "scheduled",
    },
    version: { type: Number, default: 0 },
  },
  {
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// OCC: verze neroste při prvním uložení (version=0 na create)
ticketSchema.pre("save", function (done) {
  if (!this.isNew) {
    // @ts-ignore
    this.set("version", this.get("version") + 1);
  }
  done();
});

ticketSchema.methods.ticketsAvailable = function (): number {
  return Math.max(this.totalTickets - this.soldTickets, 0);
};

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket({
    ...attrs,
    status: attrs.status ?? "scheduled",
  });
};

export const Ticket = mongoose.model<TicketDoc, TicketModel>(
  "Ticket",
  ticketSchema
);
