import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { ServiceModel } from "@/lib/models/Service";
import { CustomerModel } from "@/lib/models/Customer";
import { verifyCustomerToken } from "@/lib/auth";
import mongoose from "mongoose";
import { fail, handleRouteError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { isIsoDateTime, isObjectId, sanitizeString } from "@/lib/validation";
import { isStripeServerConfigured } from "@/lib/env";

// POST /api/v1/bookings/online
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "bookings:online", { limit: 10, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  const customerIdOrError = await verifyCustomerToken(request);
  if (customerIdOrError instanceof NextResponse) return customerIdOrError;

  try {
    const { barberId, serviceId, startTime, paymentOption, notes } = await request.json();
    if (!barberId || !serviceId || !startTime) {
      return fail("BAD_REQUEST", "barberId, serviceId, startTime required", 400);
    }
    if (typeof barberId !== "string" || !isObjectId(serviceId) || !isIsoDateTime(startTime)) {
      return fail("BAD_REQUEST", "Valid barberId, serviceId, and startTime are required", 400);
    }
    if (paymentOption !== undefined && paymentOption !== "ARRIVE" && paymentOption !== "STRIPE") {
      return fail("BAD_REQUEST", "Invalid payment option", 400);
    }

    await connectDB();

    const service = await ServiceModel.findById(serviceId).lean();
    if (!service) {
      return fail("NOT_FOUND", "Service not found", 404);
    }
    if (service.barberId !== barberId) {
      return fail("BAD_REQUEST", "Selected service does not belong to this barber", 400);
    }

    const start = new Date(startTime);
    if (start.getTime() < Date.now() - 60_000) {
      return fail("BAD_REQUEST", "Cannot book an appointment in the past", 400);
    }

    const normalizedPaymentOption: "ARRIVE" | "STRIPE" =
      paymentOption || (isStripeServerConfigured() ? "STRIPE" : "ARRIVE");

    if (normalizedPaymentOption === "STRIPE") {
      return fail(
        "PAYMENT_UNAVAILABLE",
        "Online card payment is not enabled yet. Please choose Pay on Arrival.",
        503
      );
    }

    const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

    // Race condition check
    const conflict = await BookingModel.findOne({
      barberId,
      status: { $ne: "CANCELLED" },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (conflict) {
      return fail("CONFLICT", "This time slot is no longer available", 409);
    }

    const customer = await CustomerModel.findById(customerIdOrError).lean();

    const booking = await BookingModel.create({
      barberId,
      customerId: new mongoose.Types.ObjectId(customerIdOrError),
      serviceId: new mongoose.Types.ObjectId(serviceId),
      serviceSnapshot: {
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
      },
      startTime: start,
      endTime: end,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      paymentOption: normalizedPaymentOption,
      type: "ONLINE",
      notes: sanitizeString(notes, 1000),
      // Snapshot customer details so barber can see name + phone in dashboard
      customerName: customer?.name || "Online Customer",
      customerPhone: customer?.phone || "",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
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
          // Stripe clientSecret goes here when real Stripe PaymentIntents are implemented.
          clientSecret: null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError("bookings/online", err);
  }
}
