import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { verifyCustomerToken } from "@/lib/auth";
import mongoose from "mongoose";

// GET /api/v1/bookings/me/customer
export async function GET(request: NextRequest) {
  const customerIdOrError = await verifyCustomerToken(request);
  if (customerIdOrError instanceof NextResponse) return customerIdOrError;

  try {
    await connectDB();
    const bookings = await BookingModel.find({
      customerId: new mongoose.Types.ObjectId(customerIdOrError),
    }).sort({ startTime: -1 });

    return NextResponse.json({
      success: true,
      data: bookings.map((b) => ({
        id: b._id.toString(),
        barberId: b.barberId,
        serviceSnapshot: b.serviceSnapshot,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        paymentStatus: b.paymentStatus,
        type: b.type,
        notes: b.notes,
      })),
    });
  } catch (err) {
    console.error("[bookings/me/customer]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}
