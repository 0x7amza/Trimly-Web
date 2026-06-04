import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { ServiceModel } from "@/lib/models/Service";
import { requireBarber } from "@/lib/auth";
import mongoose from "mongoose";
import { fail, handleRouteError } from "@/lib/api-response";
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
    if (!serviceId || !startTime) {
      return fail("BAD_REQUEST", "serviceId and startTime required", 400);
    }
    if (serviceId !== "blocked" && !isObjectId(serviceId)) {
      return fail("BAD_REQUEST", "Valid serviceId is required", 400);
    }
    if (!isIsoDateTime(startTime)) {
      return fail("BAD_REQUEST", "Valid startTime is required", 400);
    }
    if (durationMinutes !== undefined && !isPositiveInt(durationMinutes, 5, 12 * 60)) {
      return fail("BAD_REQUEST", "Duration must be between 5 and 720 minutes", 400);
    }

    await connectDB();

    const service = serviceId !== "blocked"
      ? await ServiceModel.findById(serviceId).lean()
      : null;
    if (serviceId !== "blocked" && !service) {
      return fail("NOT_FOUND", "Service not found", 404);
    }
    if (service && service.barberId !== result.clerkId) {
      return fail("FORBIDDEN", "You can only book your own services", 403);
    }

    const duration = durationMinutes ?? service?.durationMinutes ?? 30;
    const start = new Date(startTime);
    if (start.getTime() < Date.now() - 60_000) {
      return fail("BAD_REQUEST", "Cannot create a booking in the past", 400);
    }
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Conflict check
    const conflict = await BookingModel.findOne({
      barberId: result.clerkId,
      status: { $ne: "CANCELLED" },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (conflict) {
      return fail("CONFLICT", "Time slot is already booked", 409);
    }

    const cleanNotes = sanitizeString(notes, 1000);
    const isBlocked = cleanNotes.startsWith("[BLOCKED]");
    const booking = await BookingModel.create({
      barberId: result.clerkId,
      serviceId: service ? new mongoose.Types.ObjectId(serviceId) : undefined,
      serviceSnapshot: {
        name: isBlocked ? "Blocked Time" : (service?.name ?? "Manual Booking"),
        price: isBlocked ? 0 : (service?.price ?? 0),
        durationMinutes: duration,
      },
      startTime: start,
      endTime: end,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      type: "MANUAL",
      notes: cleanNotes || `Manual booking for ${sanitizeString(customerName, 120) || "Walk-in"}`,
      customerName: sanitizeString(customerName, 120),
      customerPhone: sanitizeString(customerPhone, 32),
    });

    return NextResponse.json(
      {
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
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError("bookings/manual", err);
  }
}
