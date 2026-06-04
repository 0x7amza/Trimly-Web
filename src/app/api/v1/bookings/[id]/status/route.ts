import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { requireBarber } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { isObjectId } from "@/lib/validation";

// PATCH /api/v1/bookings/[id]/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isObjectId(id)) {
    return fail("BAD_REQUEST", "Invalid booking id", 400);
  }

  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    const { status } = await request.json();
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return fail("BAD_REQUEST", "Invalid status", 400);
    }

    await connectDB();
    const booking = await BookingModel.findById(id);
    if (!booking) {
      return fail("NOT_FOUND", "Booking not found", 404);
    }
    if (booking.barberId !== result.clerkId) {
      return fail("FORBIDDEN", "Forbidden", 403);
    }

    booking.status = status;
    await booking.save();

    return ok({
        id: booking._id.toString(),
        barberId: booking.barberId,
        serviceSnapshot: booking.serviceSnapshot,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        type: booking.type,
        notes: booking.notes,
    });
  } catch (err) {
    return handleRouteError("bookings/id/status", err);
  }
}
