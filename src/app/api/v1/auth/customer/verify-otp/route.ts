import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models/Customer";
import { signCustomerToken } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { isE164Phone } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth:verify-otp", { limit: 8, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return fail("BAD_REQUEST", "Phone and code required", 400);
    }
    if (!isE164Phone(phone) || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return fail("BAD_REQUEST", "Valid phone and 6-digit code are required", 400);
    }

    await connectDB();
    const customer = await CustomerModel.findOne({ phone });

    if (!customer) {
      return fail("BAD_REQUEST", "No account found for this number. Please request a new code.", 400);
    }

    // Check expiry first to give a more useful error
    if (!customer.otpExpiresAt || customer.otpExpiresAt < new Date()) {
      return fail("BAD_REQUEST", "Your code has expired. Please request a new one.", 400);
    }

    if (customer.otp !== code) {
      return fail("BAD_REQUEST", "Incorrect verification code. Please check and try again.", 400);
    }

    // Clear OTP after successful verification
    customer.otp = undefined;
    customer.otpExpiresAt = undefined;
    const isNew = !customer.name || customer.name === "New Customer";
    if (isNew) customer.name = "New Customer";
    await customer.save();

    const token = await signCustomerToken(customer._id.toString());

    return ok({
        customer: {
          id: customer._id.toString(),
          phone: customer.phone,
          email: customer.email,
          name: customer.name,
        },
        token,
        isNew,
    });
  } catch (err) {
    return handleRouteError("verify-otp", err);
  }
}
