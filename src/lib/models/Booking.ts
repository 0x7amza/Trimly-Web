import mongoose, { Schema, Document, Model } from "mongoose";

const ServiceSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
  },
  { _id: false }
);

export interface IBooking extends Document {
  barberId: string; // Clerk ID
  customerId?: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  serviceSnapshot: { name: string; price: number; durationMinutes: number };
  startTime: Date;
  endTime: Date;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus: "PENDING" | "PAID" | "REFUNDED";
  paymentIntentId?: string;
  type: "ONLINE" | "MANUAL";
  notes?: string;
  customerName?: string;
  customerPhone?: string;
}

const BookingSchema = new Schema<IBooking>(
  {
    barberId: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    serviceSnapshot: { type: ServiceSnapshotSchema, required: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
      default: "CONFIRMED",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "REFUNDED"],
      default: "PENDING",
    },
    paymentIntentId: String,
    type: { type: String, enum: ["ONLINE", "MANUAL"], required: true },
    notes: String,
    customerName: String,
    customerPhone: String,
  },
  { timestamps: true }
);

// Index for fast availability lookups
BookingSchema.index({ barberId: 1, startTime: 1, endTime: 1 });

export const BookingModel: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
