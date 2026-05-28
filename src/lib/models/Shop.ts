import mongoose, { Schema, Document, Model } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    plan: { type: String, enum: ["MONTHLY", "YEARLY", "NONE"], default: "NONE" },
    status: {
      type: String,
      enum: ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"],
      default: "TRIALING",
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodEnd: Date,
    trialEndsAt: Date,
    gracePeriodEndsAt: Date,
  },
  { _id: false }
);

const BusinessHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "18:00" },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

export interface IShop extends Document {
  ownerId: string; // Clerk ID
  name: string;
  slug: string;
  subscription: {
    plan: "MONTHLY" | "YEARLY" | "NONE";
    status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: Date;
    trialEndsAt?: Date;
    gracePeriodEndsAt?: Date;
  };
  maxBarbersIncluded: number;
  profileImage?: string;
  profilePicture?: string;
  images?: string[];
  galleryPictures?: string[];
  mapUrl?: string;
  googleMapsUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  businessHours?: Array<{ day: number; open: string; close: string; isClosed: boolean }>;
}

const ShopSchema = new Schema<IShop>(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    subscription: { type: SubscriptionSchema, default: () => ({ plan: "NONE", status: "TRIALING" }) },
    maxBarbersIncluded: { type: Number, default: 5 },
    profileImage: String,
    profilePicture: String,
    images: [String],
    galleryPictures: [String],
    mapUrl: String,
    googleMapsUrl: String,
    country: String,
    state: String,
    city: String,
    address: String,
    businessHours: [BusinessHoursSchema],
  },
  { timestamps: true }
);

export const ShopModel: Model<IShop> =
  mongoose.models.Shop || mongoose.model<IShop>("Shop", ShopSchema);
