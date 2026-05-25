import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { ServiceModel } from "@/lib/models/Service";
import { requireBarber } from "@/lib/auth";
import mongoose from "mongoose";

// POST /api/v1/bookings/manual
export async function POST(request: NextRequest) {
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    const { serviceId, startTime, customerName, customerPhone, notes, durationMinutes } = await request.json();
    if (!serviceId || !startTime) {
      return NextResponse.json({ success: false, error: "serviceId and startTime required" }, { status: 400 });
    }

    await connectDB();

    const service = serviceId !== "blocked"
      ? await ServiceModel.findById(serviceId).lean()
      : null;

    const duration = durationMinutes ?? service?.durationMinutes ?? 30;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Conflict check
    const conflict = await BookingModel.findOne({
      barberId: result.clerkId,
      status: { $ne: "CANCELLED" },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });
    if (conflict) {
      return NextResponse.json({ success: false, error: "Time slot is already booked" }, { status: 409 });
    }

    const isBlocked = notes?.startsWith("[BLOCKED]");
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
      notes: notes || `Manual booking for ${customerName ?? "Walk-in"}`,
      customerName,
      customerPhone,
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
    console.error("[bookings/manual]", err);
    return NextResponse.json({ success: false, error: "Manual booking failed" }, { status: 500 });
  }
}
