import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ServiceModel } from "@/lib/models/Service";
import { requireBarber } from "@/lib/auth";

function serializeService(s: InstanceType<typeof ServiceModel>) {
  return {
    id: s._id.toString(),
    barberId: s.barberId,
    name: s.name,
    price: s.price,
    durationMinutes: s.durationMinutes,
    isActive: s.isActive,
    category: s.category,
    categoryName: s.category,
  };
}

// POST /api/v1/services
export async function POST(request: NextRequest) {
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    const { name, price, durationMinutes, category } = await request.json();
    if (!name || price == null || !durationMinutes) {
      return NextResponse.json({ success: false, error: "name, price, durationMinutes required" }, { status: 400 });
    }

    await connectDB();
    const service = await ServiceModel.create({
      barberId: result.clerkId,
      name,
      price,
      durationMinutes,
      category,
    });

    return NextResponse.json({ success: true, data: serializeService(service) }, { status: 201 });
  } catch (err) {
    console.error("[services POST]", err);
    return NextResponse.json({ success: false, error: "Failed to create service" }, { status: 500 });
  }
}
