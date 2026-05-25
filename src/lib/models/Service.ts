import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
  barberId: string; // Clerk ID
  name: string;
  price: number; // in pence
  durationMinutes: number;
  isActive: boolean;
  category?: string;
}

const ServiceSchema = new Schema<IService>(
  {
    barberId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 5 },
    isActive: { type: Boolean, default: true },
    category: String,
  },
  { timestamps: true }
);

export const ServiceModel: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);
