import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models/Customer";
import { signCustomerToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ success: false, error: "Phone and code required" }, { status: 400 });
    }

    await connectDB();
    const customer = await CustomerModel.findOne({ phone });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "No account found for this number. Please request a new code." },
        { status: 400 }
      );
    }

    // Check expiry first to give a more useful error
    if (!customer.otpExpiresAt || customer.otpExpiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Your code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (customer.otp !== code) {
      return NextResponse.json(
        { success: false, error: "Incorrect verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Clear OTP after successful verification
    customer.otp = undefined;
    customer.otpExpiresAt = undefined;
    const isNew = !customer.name || customer.name === "New Customer";
    if (isNew) customer.name = "New Customer";
    await customer.save();

    const token = await signCustomerToken(customer._id.toString());

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer._id.toString(),
          phone: customer.phone,
          email: customer.email,
          name: customer.name,
        },
        token,
        isNew,
      },
    });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json({ success: false, error: "Verification failed. Please try again." }, { status: 500 });
  }
}
