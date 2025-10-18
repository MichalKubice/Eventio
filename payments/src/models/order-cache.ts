import mongoose from "mongoose";

export enum OrderStatus {
  Created = "created",
  Cancelled = "cancelled",
  AwaitingPayment = "awaiting:payment",
  Complete = "complete",
}

interface OrderCacheAttrs {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  pricePerTicket: number;
  status: OrderStatus;
}

export interface OrderCacheDoc extends mongoose.Document {
  userId: string;
  eventId: string;
  quantity: number;
  pricePerTicket: number;
  status: OrderStatus;
  version: number;
}

interface OrderCacheModel extends mongoose.Model<OrderCacheDoc> {
  build(attrs: OrderCacheAttrs): OrderCacheDoc;
  findByEvent(event: { id: string; version: number }): Promise<OrderCacheDoc | null>;
}

const orderCacheSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerTicket: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
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

orderCacheSchema.set("versionKey", "version");

orderCacheSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return OrderCache.findOne({
    _id: event.id,
    version: event.version - 1,
  });
};

orderCacheSchema.statics.build = (attrs: OrderCacheAttrs) => {
  return new OrderCache({
    _id: attrs.id,
    ...attrs,
  });
};

const OrderCache = mongoose.model<OrderCacheDoc, OrderCacheModel>(
  "OrderCache",
  orderCacheSchema
);

export { OrderCache };
