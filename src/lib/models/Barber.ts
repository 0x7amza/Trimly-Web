import mongoose, { Schema, Document, Model } from "mongoose";

const BusinessHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "18:00" },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

export interface IBarber extends Document {
  clerkId: string;
  shopId: mongoose.Types.ObjectId;
  role: "OWNER" | "BARBER";
  name: string;
  email: string;
  shopName?: string;
  slug?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profileImage?: string;
  images?: string[];
  city?: string;
  businessHours?: Array<{ day: number; open: string; close: string; isClosed: boolean }>;
}

const BarberSchema = new Schema<IBarber>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop" },
    role: { type: String, enum: ["OWNER", "BARBER"], default: "BARBER" },
    name: { type: String, required: true },
    email: { type: String, required: true },
    shopName: String,
    slug: String,
    phone: String,
    address: String,
    bio: String,
    profileImage: String,
    images: [String],
    city: String,
    businessHours: [BusinessHoursSchema],
  },
  { timestamps: true }
);

BarberSchema.index({ shopId: 1, email: 1 });

export const BarberModel: Model<IBarber> =
  mongoose.models.Barber || mongoose.model<IBarber>("Barber", BarberSchema);
