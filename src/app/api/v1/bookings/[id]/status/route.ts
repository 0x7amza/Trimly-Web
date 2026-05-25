import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { requireBarber } from "@/lib/auth";

// PATCH /api/v1/bookings/[id]/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    const { status } = await request.json();
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    await connectDB();
    const booking = await BookingModel.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }
    if (booking.barberId !== result.clerkId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    booking.status = status;
    await booking.save();

    return NextResponse.json({
      success: true,
      data: {
        id: booking._id.toString(),
        barberId: booking.barberId,
        serviceSnapshot: booking.serviceSnapshot,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        type: booking.type,
        notes: booking.notes,
      },
    });
  } catch (err) {
    console.error("[bookings/id/status]", err);
    return NextResponse.json({ success: false, error: "Status update failed" }, { status: 500 });
  }
}
