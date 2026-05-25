import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models/Customer";
import { signCustomerToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { phone, email, password, name } = await request.json();
    if (!phone || !name) {
      return NextResponse.json({ success: false, error: "Phone and name required" }, { status: 400 });
    }

    await connectDB();

    const existing = await CustomerModel.findOne({ phone });
    if (existing) {
      return NextResponse.json({ success: false, error: "Phone number already registered" }, { status: 409 });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    const customer = await CustomerModel.create({ phone, email, name, passwordHash });
    const token = await signCustomerToken(customer._id.toString());

    return NextResponse.json(
      {
        success: true,
        data: {
          customer: { id: customer._id.toString(), phone, email, name },
          token,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
  }
}
