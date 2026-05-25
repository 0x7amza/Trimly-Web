import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { ServiceModel } from "@/lib/models/Service";
import { CustomerModel } from "@/lib/models/Customer";
import { verifyCustomerToken } from "@/lib/auth";
import mongoose from "mongoose";

// POST /api/v1/bookings/online
export async function POST(request: NextRequest) {
  const customerIdOrError = await verifyCustomerToken(request);
  if (customerIdOrError instanceof NextResponse) return customerIdOrError;

  try {
    const { barberId, serviceId, startTime, paymentOption } = await request.json();
    if (!barberId || !serviceId || !startTime) {
      return NextResponse.json({ success: false, error: "barberId, serviceId, startTime required" }, { status: 400 });
    }

    await connectDB();

    const service = await ServiceModel.findById(serviceId).lean();
    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

    // Race condition check
    const conflict = await BookingModel.findOne({
      barberId,
      status: { $ne: "CANCELLED" },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (conflict) {
      return NextResponse.json({ success: false, error: "This time slot is no longer available" }, { status: 409 });
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
      paymentStatus: paymentOption === "ARRIVE" ? "PENDING" : "PENDING", // can keep PENDING or update accordingly
      paymentOption: paymentOption || "STRIPE",
      type: "ONLINE",
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
            type: booking.type,
          },
          // Stripe clientSecret goes here when Stripe is configured
          clientSecret: null,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[bookings/online]", err);
    return NextResponse.json({ success: false, error: "Booking failed" }, { status: 500 });
  }
}
