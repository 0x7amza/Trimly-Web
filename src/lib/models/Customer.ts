import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  phone: string;
  email: string;
  name: string;
  passwordHash?: string;
  otp?: string;
  otpExpiresAt?: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true, index: true },
    name: { type: String, required: true },
    passwordHash: String,
    otp: String,
    otpExpiresAt: Date,
  },
  { timestamps: true }
);

export const CustomerModel: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
