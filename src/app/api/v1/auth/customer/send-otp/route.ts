import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models/Customer";

// Generates a 6-digit OTP and saves it (expires in 10 minutes)
// In production: send via Twilio/WhatsApp. Here we log it to console.
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number required" }, { status: 400 });
    }

    await connectDB();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await CustomerModel.findOneAndUpdate(
      { phone },
      { otp, otpExpiresAt },
      { upsert: true, new: true }
    );

    // TODO: Replace with Twilio/WhatsApp in production
    console.log(`[OTP] Phone: ${phone} | Code: ${otp}`);

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 });
  }
}
