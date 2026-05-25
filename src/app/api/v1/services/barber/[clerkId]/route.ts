import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ServiceModel } from "@/lib/models/Service";

// GET /api/v1/services/barber/[clerkId]  — public endpoint
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  const { clerkId } = await params;
  if (!clerkId) {
    return NextResponse.json({ success: false, error: "clerkId required" }, { status: 400 });
  }

  try {
    await connectDB();
    const services = await ServiceModel.find({ barberId: clerkId, isActive: true }).lean();

    return NextResponse.json({
      success: true,
      data: services.map((s) => ({
        id: s._id.toString(),
        barberId: s.barberId,
        name: s.name,
        price: s.price,
        durationMinutes: s.durationMinutes,
        isActive: s.isActive,
        category: s.category,
        categoryName: s.category,
      })),
    });
  } catch (err) {
    console.error("[services/barber/clerkId]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch services" }, { status: 500 });
  }
}
