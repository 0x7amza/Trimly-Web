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

    const cleanPhone = phone.trim();
    // Validate phone number: must be at least 10 digits
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json({ success: false, error: "Please enter a valid phone number with country code (e.g. +447000000000)" }, { status: 400 });
    }

    await connectDB();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await CustomerModel.findOneAndUpdate(
      { phone: cleanPhone },
      { otp, otpExpiresAt },
      { upsert: true, new: true }
    );

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (sid && token && fromNumber) {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const basicAuth = Buffer.from(`${sid}:${token}`).toString("base64");
      const twilioBody = new URLSearchParams({
        From: fromNumber,
        To: cleanPhone,
        Body: `Your Trimly verification code is: ${otp}`,
      });

      const twilioRes = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: twilioBody.toString(),
      });

      if (!twilioRes.ok) {
        const errText = await twilioRes.text();
        console.error("Twilio SMS send failed:", errText);
        return NextResponse.json({ success: false, error: "Failed to dispatch verification SMS via Twilio." }, { status: 502 });
      }
    } else {
      console.log(`[OTP Sandbox Fallback] Phone: ${cleanPhone} | Code: ${otp}`);
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("[send-otp]", err);
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 });
  }
}
