import mongoose from "mongoose";

interface TicketAttrs {
  title: string;
  description?: string;
  price: number;
  userId: string;
  totalTickets: number;
  ticketsAvailable?: number;
  startSaleAt: Date;
  status?: "scheduled" | "active" | "ended";
}

interface TicketDoc extends mongoose.Document {
  title: string;
  description?: string;
  price: number;
  userId: string;
  totalTickets: number;
  ticketsAvailable: number;
  startSaleAt: Date;
  status: "scheduled" | "active" | "ended";
  version: number;
}

interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    totalTickets: {
      type: Number,
      required: true,
      min: 1,
    },
    ticketsAvailable: {
      type: Number,
      required: true,
      min: 0,
    },
    startSaleAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "ended"],
      default: "scheduled",
    },
    version: {
      type: Number,
      default: 0,
    },
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

ticketSchema.pre("save", function (done) {
  this.set("version", this.get("version") + 1);
  done();
});

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket({
    ...attrs,
    ticketsAvailable: attrs.ticketsAvailable ?? attrs.totalTickets,
    status: attrs.status ?? "scheduled",
  });
};

const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", ticketSchema);

export { Ticket };
