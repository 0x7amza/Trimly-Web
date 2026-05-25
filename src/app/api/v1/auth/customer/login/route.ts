import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models/Customer";
import { signCustomerToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: "Identifier and password required" }, { status: 400 });
    }

    await connectDB();

    const customer = await CustomerModel.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!customer || !customer.passwordHash) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

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
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
