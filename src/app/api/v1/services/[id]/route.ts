import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ServiceModel } from "@/lib/models/Service";
import { requireBarber } from "@/lib/auth";

// PUT /api/v1/services/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    await connectDB();
    const service = await ServiceModel.findById(id);
    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }
    if (service.barberId !== result.clerkId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { name, price, durationMinutes, category } = await request.json();
    if (name !== undefined) service.name = name;
    if (price !== undefined) service.price = price;
    if (durationMinutes !== undefined) service.durationMinutes = durationMinutes;
    if (category !== undefined) service.category = category;
    await service.save();

    return NextResponse.json({
      success: true,
      data: {
        id: service._id.toString(),
        barberId: service.barberId,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
        isActive: service.isActive,
        category: service.category,
        categoryName: service.category,
      },
    });
  } catch (err) {
    console.error("[services/id PUT]", err);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}

// DELETE /api/v1/services/[id]  (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    await connectDB();
    const service = await ServiceModel.findById(id);
    if (!service) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }
    if (service.barberId !== result.clerkId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    service.isActive = false;
    await service.save();

    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (err) {
    console.error("[services/id DELETE]", err);
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
