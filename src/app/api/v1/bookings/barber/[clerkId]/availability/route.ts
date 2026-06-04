import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { ServiceModel } from "@/lib/models/Service";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { generateAvailableSlotStarts, getDateRangeInTimeZone } from "@/lib/booking-time";
import { getBarberSchedule } from "@/lib/booking-schedule";
import { isDateOnly, isObjectId } from "@/lib/validation";

// GET /api/v1/bookings/barber/[clerkId]/availability?serviceId=...&date=YYYY-MM-DD
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  const { clerkId } = await params;
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date");

  if (!serviceId || !dateStr) {
    return fail("VALIDATION_ERROR", "serviceId and date are required", 400);
  }
  if (!isObjectId(serviceId) || !isDateOnly(dateStr) || !clerkId.trim()) {
    return fail("VALIDATION_ERROR", "Valid serviceId, barberId, and date are required", 400);
  }

  try {
    await connectDB();

    const schedule = await getBarberSchedule(clerkId);
    if (!schedule) {
      return fail("NOT_FOUND", "Barber not found", 404);
    }

    const service = await ServiceModel.findById(serviceId).lean();
    if (!service || !service.isActive || service.barberId !== clerkId) {
      return fail("NOT_FOUND", "Service not found for this barber", 404);
    }

    const dayRange = getDateRangeInTimeZone(dateStr, schedule.timeZone);
    if (!dayRange) {
      return fail("VALIDATION_ERROR", "Invalid date or shop timezone", 400);
    }

    const bookings = await BookingModel.find({
      barberId: clerkId,
      status: { $ne: "CANCELLED" },
      startTime: { $lt: dayRange.end },
      endTime: { $gt: dayRange.start },
    })
      .select({ startTime: 1, endTime: 1 })
      .lean();

    const slots = generateAvailableSlotStarts({
      dateStr,
      durationMinutes: service.durationMinutes,
      businessHours: schedule.businessHours,
      timeZone: schedule.timeZone,
      bookings,
    }).map((slot) => slot.toISOString());

    return ok(slots);
  } catch (error) {
    return handleRouteError("availability", error);
  }
}
