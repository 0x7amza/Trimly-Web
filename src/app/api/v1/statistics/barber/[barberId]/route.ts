import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BookingModel } from "@/lib/models/Booking";
import { requireBarber } from "@/lib/auth";

// GET /api/v1/statistics/barber/[barberId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ barberId: string }> }
) {
  const { barberId } = await params;
  const result = await requireBarber();
  if ("error" in result) return result.error;

  // Barbers can only view their own stats; owners can view any
  const targetId = barberId && result.barber.role === "OWNER" ? barberId : result.clerkId;

  try {
    await connectDB();
    const bookings = await BookingModel.find({ barberId: targetId });

    const now = new Date();
    const total = bookings.length;
    const completed = bookings.filter((b) => b.status === "COMPLETED").length;
    const upcoming = bookings.filter(
      (b) => (b.status === "CONFIRMED" || b.status === "PENDING") && new Date(b.startTime) >= now
    ).length;
    const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;

    return NextResponse.json({
      success: true,
      data: { totalBookings: total, completedBookings: completed, upcomingBookings: upcoming, cancelledBookings: cancelled },
    });
  } catch (err) {
    console.error("[statistics/barber]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch statistics" }, { status: 500 });
  }
}
