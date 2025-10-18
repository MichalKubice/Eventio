import mongoose from "mongoose";

export enum OrderStatus {
  Created = "created", // přijato API
  PendingValidation = "pending:validation", // čeká na Tickets (order:accepted/rejected)
  AwaitingPayment = "awaiting:payment",
  Cancelled = "cancelled",
  Complete = "complete",
}

interface OrderAttrs {
  userId: string;
  eventId: string; // ticketId
  quantity: number;
  pricePerTicket: number; // snapshot
  expiresAt: Date;
  status?: OrderStatus;
}

export interface OrderDoc extends mongoose.Document {
  userId: string;
  eventId: string;
  quantity: number;
  pricePerTicket: number;
  expiresAt: Date;
  status: OrderStatus;
  version: number;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerTicket: { type: Number, required: true, min: 0 },
    expiresAt: { type: mongoose.Schema.Types.Date, required: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PendingValidation,
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

orderSchema.set("versionKey", "version");

orderSchema.statics.build = (attrs: OrderAttrs) => new Order(attrs);

export const Order = mongoose.model<OrderDoc, OrderModel>("Order", orderSchema);
