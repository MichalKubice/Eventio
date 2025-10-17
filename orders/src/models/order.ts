import mongoose from "mongoose";

enum OrderStatus {
   Created = "created",
   Cancelled = "cancelled",
   AwaitingPayment = "awaiting:payment",
   Complete = "complete",
 }

interface OrderAttrs {
  userId: string;
  status?: OrderStatus;
  expiresAt: Date;
  eventId: string; // ID eventu (z Events service)
  quantity: number; // Počet objednaných lístků
  pricePerTicket: number; // Cena v době objednávky (snapshot)
}

interface OrderDoc extends mongoose.Document {
  userId: string;
  status: OrderStatus;
  expiresAt: Date;
  eventId: string;
  quantity: number;
  pricePerTicket: number;
  version: number;
}

interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Created,
    },
    expiresAt: { type: mongoose.Schema.Types.Date },
    eventId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerTicket: { type: Number, required: true, min: 0 },
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

orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order(attrs);
};

const Order = mongoose.model<OrderDoc, OrderModel>("Order", orderSchema);

export { Order, OrderStatus };
