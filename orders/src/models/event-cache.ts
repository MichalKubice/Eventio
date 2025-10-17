import mongoose from "mongoose";

interface EventCacheAttrs {
  id: string; // eventId z Events služby
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  ticketsAvailable: number;
  status: "scheduled" | "active" | "ended";
  startSaleAt: Date;
  version: number;
}

export interface EventCacheDoc extends mongoose.Document {
  title: string;
  description?: string;
  price: number;
  totalTickets: number;
  ticketsAvailable: number;
  status: "scheduled" | "active" | "ended";
  startSaleAt: Date;
  version: number;
}

interface EventCacheModel extends mongoose.Model<EventCacheDoc> {
  build(attrs: EventCacheAttrs): EventCacheDoc;
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<EventCacheDoc | null>;
}

const eventSchema = new mongoose.Schema(
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

eventSchema.set("versionKey", "version");

eventSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return EventCache.findOne({
    _id: event.id,
    version: event.version - 1,
  });
};

eventSchema.statics.build = (attrs: EventCacheAttrs) => {
  return new EventCache({
    _id: attrs.id,
    ...attrs,
  });
};

const EventCache = mongoose.model<EventCacheDoc, EventCacheModel>(
  "EventCache",
  eventSchema
);

export { EventCache };
