import mongoose from "mongoose";

 enum PaymentStatus {
  Pending = "pending",
  Succeeded = "succeeded",
  Failed = "failed",
  Refunded = "refunded",
}

interface PaymentAttrs {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  idempotencyKey?: string;
  status?: PaymentStatus;
}

interface PaymentDoc extends mongoose.Document {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  idempotencyKey?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    idempotencyKey: { type: String },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Pending,
    },
  },
  { timestamps: true, toJSON: { transform(doc, ret: any) { ret.id = ret._id; delete ret._id; } } }
);

paymentSchema.statics.build = (attrs: PaymentAttrs) => new Payment(attrs);

const Payment = mongoose.model<PaymentDoc, PaymentModel>("Payment", paymentSchema);

export { Payment, PaymentStatus };
