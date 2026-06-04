import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models/Customer";
import { fail, handleRouteError, okMessage } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { isE164Phone } from "@/lib/validation";

// Generates a 6-digit OTP and saves it (expires in 10 minutes)
// Sends via Twilio SMS if configured, or returns sandbox OTP in dev mode
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth:send-otp", { limit: 5, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  try {
    const { phone } = await request.json();
    if (!phone) {
      return fail("BAD_REQUEST", "Phone number required", 400);
    }

    const cleanPhone = phone.trim();

    // Enforce strict E.164 international format: +[country code][number], 7–15 digits total
    if (!isE164Phone(cleanPhone)) {
      return fail("BAD_REQUEST", "Please enter a valid phone number in international format (e.g. +447911123456)", 400);
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
    const isDev = process.env.NODE_ENV !== "production";

    if (sid && token && fromNumber) {
      // Production: Send real SMS via Twilio
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const basicAuth = Buffer.from(`${sid}:${token}`).toString("base64");
      const twilioBody = new URLSearchParams({
        From: fromNumber,
        To: cleanPhone,
        Body: `Your Trimly verification code is: ${otp}. Valid for 10 minutes.`,
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
        return fail("INTERNAL_ERROR", "Failed to dispatch verification SMS. Please try again.", 502);
      }

      return okMessage("OTP sent successfully");
    } else {
      // Sandbox/Development: Log OTP and return it in response for easy testing
      console.log(`[OTP Sandbox] Phone: ${cleanPhone} | Code: ${otp}`);
      return NextResponse.json({
        success: true,
        message: "OTP sent (sandbox mode)",
        // Only expose OTP in non-production environments for developer testing
        ...(isDev && { sandboxOtp: otp }),
      });
    }
  } catch (err) {
    return handleRouteError("send-otp", err);
  }
}
