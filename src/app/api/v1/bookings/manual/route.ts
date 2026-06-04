import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { ServiceModel } from "@/lib/models/Service";
import { requireBarber } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { BookingLockUnavailableError, withBarberBookingLock } from "@/lib/booking-lock";
import { getBarberSchedule } from "@/lib/booking-schedule";
import { validateBookingTime } from "@/lib/booking-time";
import { rateLimit } from "@/lib/rate-limit";
import { isIsoDateTime, isObjectId, isPositiveInt, sanitizeString } from "@/lib/validation";

// POST /api/v1/bookings/manual
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "bookings:manual", { limit: 30, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    const { serviceId, startTime, customerName, customerPhone, notes, durationMinutes } = await request.json();
    if ((serviceId !== "blocked" && !isObjectId(serviceId)) || !isIsoDateTime(startTime)) {
      return fail("VALIDATION_ERROR", "Valid serviceId and startTime are required", 400);
    }
    if (durationMinutes !== undefined && !isPositiveInt(durationMinutes, 5, 12 * 60)) {
      return fail("VALIDATION_ERROR", "Duration must be between 5 and 720 minutes", 400);
    }

    await connectDB();

    const [service, schedule] = await Promise.all([
      serviceId !== "blocked" ? ServiceModel.findById(serviceId).lean() : null,
      getBarberSchedule(result.clerkId),
    ]);

    if (serviceId !== "blocked" && (!service || !service.isActive)) {
      return fail("NOT_FOUND", "Service not found", 404);
    }
    if (service && service.barberId !== result.clerkId) {
      return fail("FORBIDDEN", "You can only book your own services", 403);
    }
    if (!schedule) {
      return fail("NOT_FOUND", "Barber not found", 404);
    }

    const duration = durationMinutes ?? service?.durationMinutes ?? 30;
    const validation = validateBookingTime({
      start: new Date(startTime),
      durationMinutes: duration,
      businessHours: schedule.businessHours,
      timeZone: schedule.timeZone,
    });
    if (!validation.ok) {
      return fail(validation.code, validation.message, 400);
    }

    const cleanNotes = sanitizeString(notes, 1000);
    const isBlocked = serviceId === "blocked" || cleanNotes.startsWith("[BLOCKED]");
    const booking = await withBarberBookingLock(result.clerkId, async () => {
      const conflict = await BookingModel.findOne({
        barberId: result.clerkId,
        status: { $ne: "CANCELLED" },
        startTime: { $lt: validation.end },
        endTime: { $gt: validation.start },
      }).lean();
      if (conflict) return null;

      return BookingModel.create({
        barberId: result.clerkId,
        serviceId: service ? new mongoose.Types.ObjectId(serviceId) : undefined,
        serviceSnapshot: {
          name: isBlocked ? "Blocked Time" : service?.name ?? "Manual Booking",
          price: isBlocked ? 0 : service?.price ?? 0,
          durationMinutes: duration,
        },
        startTime: validation.start,
        endTime: validation.end,
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        paymentOption: "ARRIVE",
        type: "MANUAL",
        notes: cleanNotes || `Manual booking for ${sanitizeString(customerName, 120) || "Walk-in"}`,
        customerName: sanitizeString(customerName, 120),
        customerPhone: sanitizeString(customerPhone, 32),
      });
    });

    if (!booking) {
      return fail("SLOT_UNAVAILABLE", "This time is no longer available. Please choose another slot.", 409);
    }

    return ok(
      {
        id: booking._id.toString(),
        barberId: booking.barberId,
        serviceSnapshot: booking.serviceSnapshot,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        type: booking.type,
        notes: booking.notes,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
      },
      201
    );
  } catch (error) {
    if (error instanceof BookingLockUnavailableError) {
      return fail("SLOT_UNAVAILABLE", error.message, 409);
    }
    return handleRouteError("bookings/manual", error);
  }
}
