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

    if (!customer || customer.otp !== code) {
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });
    }

    if (!customer.otpExpiresAt || customer.otpExpiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "OTP has expired" }, { status: 400 });
    }

    // Clear OTP after use
    customer.otp = undefined;
    customer.otpExpiresAt = undefined;
    const isNew = !customer.name;
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
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
