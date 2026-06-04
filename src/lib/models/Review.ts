import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  shopId: mongoose.Types.ObjectId;
  customerName: string;
  rating: number; // 1 to 5
  comment?: string; // Client "Notes"
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReviewSchema.index({ shopId: 1, createdAt: -1 });

export const ReviewModel: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
