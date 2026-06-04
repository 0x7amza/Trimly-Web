import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBookingLock extends Document {
  barberId: string;
  ownerToken: string;
  expiresAt: Date;
}

const BookingLockSchema = new Schema<IBookingLock>(
  {
    barberId: { type: String, required: true, unique: true, index: true },
    ownerToken: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export const BookingLockModel: Model<IBookingLock> =
  mongoose.models.BookingLock || mongoose.model<IBookingLock>("BookingLock", BookingLockSchema);
