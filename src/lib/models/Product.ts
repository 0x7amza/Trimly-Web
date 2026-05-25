import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number; // in pence
  imageUrl?: string;
  isActive: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    imageUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
