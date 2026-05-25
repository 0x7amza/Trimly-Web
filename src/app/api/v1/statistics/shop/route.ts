import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { BarberModel } from "@/lib/models/Barber";
import { requireOwner } from "@/lib/auth";

// GET /api/v1/statistics/shop
export async function GET() {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  try {
    await connectDB();

    // Get all barbers in this shop
    const barbers = await BarberModel.find({ shopId: result.barber.shopId });
    const barberIds = barbers.map((b) => b.clerkId);

    const bookings = await BookingModel.find({ barberId: { $in: barberIds } });

    const now = new Date();
    const total = bookings.length;
    const completed = bookings.filter((b) => b.status === "COMPLETED").length;
    const upcoming = bookings.filter(
      (b) => (b.status === "CONFIRMED" || b.status === "PENDING") && new Date(b.startTime) >= now
    ).length;
    const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;

    return NextResponse.json({
      success: true,
      data: {
        totalBookings: total,
        completedBookings: completed,
        upcomingBookings: upcoming,
        cancelledBookings: cancelled,
        totalBarbers: barbers.length,
      },
    });
  } catch (err) {
    console.error("[statistics/shop]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch statistics" }, { status: 500 });
  }
}
