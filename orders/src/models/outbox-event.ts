import mongoose from "mongoose";

export enum OutboxStatus {
  Pending = "pending",
  Published = "published",
  Failed = "failed",
}

interface OutboxEventAttrs {
  exchange: string;
  payload: any;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
}

export interface OutboxEventDoc extends mongoose.Document {
  exchange: string;
  payload: any;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: Date;
  publishedAt?: Date;
}

interface OutboxEventModel extends mongoose.Model<OutboxEventDoc> {
  build(attrs: OutboxEventAttrs): OutboxEventDoc;
}

const outboxEventSchema = new mongoose.Schema(
  {
    exchange: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    aggregateId: { type: String, required: true, index: true },
    aggregateType: { type: String, required: true },
    eventType: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(OutboxStatus),
      default: OutboxStatus.Pending,
      required: true,
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

outboxEventSchema.index({ status: 1, createdAt: 1 });

outboxEventSchema.statics.build = (attrs: OutboxEventAttrs) =>
  new OutboxEvent(attrs);

export const OutboxEvent = mongoose.model<OutboxEventDoc, OutboxEventModel>(
  "OutboxEvent",
  outboxEventSchema
);
