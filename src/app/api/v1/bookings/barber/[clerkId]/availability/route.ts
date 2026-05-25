import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { ServiceModel } from "@/lib/models/Service";
import { BarberModel } from "@/lib/models/Barber";

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
    return NextResponse.json({ success: false, error: "serviceId and date are required" }, { status: 400 });
  }

  try {
    await connectDB();

    // Fetch barber for business hours
    const barber = await BarberModel.findOne({ clerkId }).lean();
    if (!barber) {
      return NextResponse.json({ success: false, error: "Barber not found" }, { status: 404 });
    }

    const service = await ServiceModel.findById(serviceId).lean();
    const durationMs = (service?.durationMinutes ?? 30) * 60 * 1000;

    // Day-of-week for business hours (0=Sun, 1=Mon...)
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    const dayOfWeek = date.getUTCDay();
    const dayHours = barber.businessHours?.find((h) => h.day === dayOfWeek);

    if (dayHours?.isClosed) {
      return NextResponse.json({ success: true, data: [] });
    }

    const [openH, openM] = (dayHours?.open ?? "09:00").split(":").map(Number);
    const [closeH, closeM] = (dayHours?.close ?? "18:00").split(":").map(Number);
    const openMs = (openH * 60 + openM) * 60 * 1000;
    const closeMs = (closeH * 60 + closeM) * 60 * 1000;

    // Fetch existing bookings for that day
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const bookings = await BookingModel.find({
      barberId: clerkId,
      status: { $ne: "CANCELLED" },
      startTime: { $lte: dayEnd },
      endTime: { $gte: dayStart },
    }).lean();

    // Build available 15-min slots
    const slots: string[] = [];
    const baseTime = new Date(`${dateStr}T00:00:00.000Z`).getTime();

    for (let offsetMs = openMs; offsetMs + durationMs <= closeMs; offsetMs += 15 * 60 * 1000) {
      const slotStart = baseTime + offsetMs;
      const slotEnd = slotStart + durationMs;

      const overlaps = bookings.some((b) => {
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!overlaps) {
        slots.push(new Date(slotStart).toISOString());
      }
    }

    return NextResponse.json({ success: true, data: slots });
  } catch (err) {
    console.error("[availability]", err);
    return NextResponse.json({ success: false, error: "Failed to compute availability" }, { status: 500 });
  }
}
