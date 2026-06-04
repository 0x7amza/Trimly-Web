import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { CustomerModel } from "@/lib/models/Customer";
import { ServiceModel } from "@/lib/models/Service";
import { verifyCustomerToken } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { BookingLockUnavailableError, withBarberBookingLock } from "@/lib/booking-lock";
import { getBarberSchedule } from "@/lib/booking-schedule";
import { validateBookingTime } from "@/lib/booking-time";
import { rateLimit } from "@/lib/rate-limit";
import { isIsoDateTime, isObjectId, sanitizeString } from "@/lib/validation";

// POST /api/v1/bookings/online
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "bookings:online", { limit: 10, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const customerIdOrError = await verifyCustomerToken(request);
  if (customerIdOrError instanceof NextResponse) return customerIdOrError;

  try {
    const { barberId, serviceId, startTime, paymentOption, notes } = await request.json();
    if (
      typeof barberId !== "string" ||
      !barberId.trim() ||
      !isObjectId(serviceId) ||
      !isIsoDateTime(startTime)
    ) {
      return fail("VALIDATION_ERROR", "Valid barberId, serviceId, and startTime are required", 400);
    }
    if (paymentOption !== undefined && paymentOption !== "ARRIVE" && paymentOption !== "STRIPE") {
      return fail("VALIDATION_ERROR", "Invalid payment option", 400);
    }

    await connectDB();

    const [service, schedule, customer] = await Promise.all([
      ServiceModel.findById(serviceId).lean(),
      getBarberSchedule(barberId),
      CustomerModel.findById(customerIdOrError).lean(),
    ]);

    if (!service || !service.isActive) {
      return fail("NOT_FOUND", "Service not found", 404);
    }
    if (!schedule || service.barberId !== barberId) {
      return fail("VALIDATION_ERROR", "Selected service does not belong to this barber", 400);
    }

    const validation = validateBookingTime({
      start: new Date(startTime),
      durationMinutes: service.durationMinutes,
      businessHours: schedule.businessHours,
      timeZone: schedule.timeZone,
      enforceBuffer: true,
    });
    if (!validation.ok) {
      return fail(validation.code, validation.message, 400);
    }

    const normalizedPaymentOption: "ARRIVE" | "STRIPE" = paymentOption || "ARRIVE";
    if (normalizedPaymentOption === "STRIPE") {
      return fail(
        "PAYMENT_UNAVAILABLE",
        "Online card payment is not enabled yet. Please choose Pay on Arrival.",
        503
      );
    }

    const booking = await withBarberBookingLock(barberId, async () => {
      const conflict = await BookingModel.findOne({
        barberId,
        status: { $ne: "CANCELLED" },
        startTime: { $lt: validation.end },
        endTime: { $gt: validation.start },
      }).lean();
      if (conflict) return null;

      return BookingModel.create({
        barberId,
        customerId: new mongoose.Types.ObjectId(customerIdOrError),
        serviceId: new mongoose.Types.ObjectId(serviceId),
        serviceSnapshot: {
          name: service.name,
          price: service.price,
          durationMinutes: service.durationMinutes,
        },
        startTime: validation.start,
        endTime: validation.end,
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        paymentOption: normalizedPaymentOption,
        type: "ONLINE",
        notes: sanitizeString(notes, 1000),
        customerName: customer?.name || "Online Customer",
        customerPhone: customer?.phone || "",
      });
    });

    if (!booking) {
      return fail("SLOT_UNAVAILABLE", "This time is no longer available. Please choose another slot.", 409);
    }

    return ok(
      {
        booking: {
          id: booking._id.toString(),
          barberId: booking.barberId,
          customerId: booking.customerId?.toString(),
          serviceId: booking.serviceId?.toString(),
          serviceSnapshot: booking.serviceSnapshot,
          startTime: booking.startTime.toISOString(),
          endTime: booking.endTime.toISOString(),
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          paymentOption: booking.paymentOption,
          type: booking.type,
          notes: booking.notes,
        },
        clientSecret: null,
      },
      201
    );
  } catch (error) {
    if (error instanceof BookingLockUnavailableError) {
      return fail("SLOT_UNAVAILABLE", error.message, 409);
    }
    return handleRouteError("bookings/online", error);
  }
}
