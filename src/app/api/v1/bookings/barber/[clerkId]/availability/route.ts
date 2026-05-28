import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { ServiceModel } from "@/lib/models/Service";
import { BarberModel } from "@/lib/models/Barber";
import { ShopModel } from "@/lib/models/Shop";

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

    // Fetch barber for shopId reference
    const barber = await BarberModel.findOne({ clerkId }).lean();
    if (!barber) {
      return NextResponse.json({ success: false, error: "Barber not found" }, { status: 404 });
    }

    const service = await ServiceModel.findById(serviceId).lean();
    const durationMs = (service?.durationMinutes ?? 30) * 60 * 1000;

    // --- CRITICAL FIX: Read businessHours from the Shop document ---
    // The dashboard settings page saves businessHours to the Shop model.
    // The Barber model's businessHours field is rarely populated.
    let businessHours: Array<{ day: number; open: string; close: string; isClosed: boolean }> | undefined;

    if (barber.shopId) {
      const shop = await ShopModel.findById(barber.shopId).lean();
      if (shop?.businessHours && shop.businessHours.length > 0) {
        businessHours = shop.businessHours as Array<{ day: number; open: string; close: string; isClosed: boolean }>;
      }
    }

    // Fall back to barber-level hours if shop hours aren't configured
    if (!businessHours || businessHours.length === 0) {
      businessHours = barber.businessHours as Array<{ day: number; open: string; close: string; isClosed: boolean }> | undefined;
    }

    // Day-of-week for business hours (0=Sun, 1=Mon...)
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    const dayOfWeek = date.getUTCDay();
    const dayHours = businessHours?.find((h) => h.day === dayOfWeek);

    // If the day is marked Closed, return empty slots
    if (dayHours?.isClosed) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Default to 09:00–18:00 only if no hours configured at all
    const [openH, openM] = (dayHours?.open ?? "09:00").split(":").map(Number);
    const [closeH, closeM] = (dayHours?.close ?? "18:00").split(":").map(Number);
    const openMs = (openH * 60 + openM) * 60 * 1000;
    const closeMs = (closeH * 60 + closeM) * 60 * 1000;

    // Fetch existing confirmed/pending bookings for that day
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const bookings = await BookingModel.find({
      barberId: clerkId,
      status: { $ne: "CANCELLED" },
      startTime: { $lte: dayEnd },
      endTime: { $gte: dayStart },
    }).lean();

    // Build available 15-min slots, filtered by service duration overlap
    const slots: string[] = [];
    const baseTime = new Date(`${dateStr}T00:00:00.000Z`).getTime();

    for (let offsetMs = openMs; offsetMs + durationMs <= closeMs; offsetMs += 15 * 60 * 1000) {
      const slotStart = baseTime + offsetMs;
      const slotEnd = slotStart + durationMs;

      // Skip if this slot overlaps any existing confirmed booking
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
