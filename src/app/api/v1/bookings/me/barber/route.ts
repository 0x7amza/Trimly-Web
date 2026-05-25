import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { requireBarber } from "@/lib/auth";

function serializeBooking(b: InstanceType<typeof BookingModel>) {
  return {
    id: b._id.toString(),
    barberId: b.barberId,
    customerId: b.customerId?.toString(),
    serviceId: b.serviceId?.toString(),
    serviceSnapshot: b.serviceSnapshot,
    startTime: b.startTime instanceof Date ? b.startTime.toISOString() : b.startTime,
    endTime: b.endTime instanceof Date ? b.endTime.toISOString() : b.endTime,
    status: b.status,
    paymentStatus: b.paymentStatus,
    paymentIntentId: b.paymentIntentId,
    type: b.type,
    notes: b.notes,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
  };
}

// GET /api/v1/bookings/me/barber
export async function GET() {
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    await connectDB();
    const bookings = await BookingModel.find({
      barberId: result.clerkId,
      status: { $ne: "CANCELLED" },
    }).sort({ startTime: 1 });

    return NextResponse.json({
      success: true,
      data: bookings.map(serializeBooking),
    });
  } catch (err) {
    console.error("[bookings/me/barber]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}
