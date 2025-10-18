import mongoose from "mongoose";

interface TicketCacheAttrs {
  id: string;
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  status: "scheduled" | "active" | "ended";
  startSaleAt: Date;
  version: number;
}

export interface TicketCacheDoc extends mongoose.Document {
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  soldTickets: number;
  status: "scheduled" | "active" | "ended";
  startSaleAt: Date;
  version: number;
}

interface TicketCacheModel extends mongoose.Model<TicketCacheDoc> {
  build(attrs: TicketCacheAttrs): TicketCacheDoc;
}

const schema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    totalTickets: Number,
    soldTickets: Number,
    status: { type: String, enum: ["scheduled", "active", "ended"] },
    startSaleAt: Date,
    version: Number,
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

schema.statics.build = (attrs: TicketCacheAttrs) =>
  new TicketCache({ _id: attrs.id, ...attrs });

export const TicketCache = mongoose.model<TicketCacheDoc, TicketCacheModel>(
  "TicketCache",
  schema
);
