import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ServiceModel } from "@/lib/models/Service";
import { requireBarber } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { isObjectId, isPositiveInt, sanitizeString } from "@/lib/validation";

// PUT /api/v1/services/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isObjectId(id)) {
    return fail("VALIDATION_ERROR", "Invalid service id", 400);
  }
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    await connectDB();
    const service = await ServiceModel.findById(id);
    if (!service) {
      return fail("NOT_FOUND", "Service not found", 404);
    }
    if (service.barberId !== result.clerkId) {
      return fail("FORBIDDEN", "Forbidden", 403);
    }

    const { name, price, durationMinutes, category } = await request.json();
    if (name !== undefined) {
      const cleanName = sanitizeString(name, 120);
      if (!cleanName) return fail("VALIDATION_ERROR", "Service name is required", 400);
      service.name = cleanName;
    }
    if (price !== undefined) {
      if (!isPositiveInt(price, 0, 10_000_000)) return fail("VALIDATION_ERROR", "Invalid price", 400);
      service.price = price;
    }
    if (durationMinutes !== undefined) {
      if (!isPositiveInt(durationMinutes, 5, 12 * 60)) return fail("VALIDATION_ERROR", "Invalid duration", 400);
      service.durationMinutes = durationMinutes;
    }
    if (category !== undefined) service.category = sanitizeString(category, 80);
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
    return handleRouteError("services/id PUT", err);
  }
}

// DELETE /api/v1/services/[id]  (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isObjectId(id)) {
    return fail("VALIDATION_ERROR", "Invalid service id", 400);
  }
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    await connectDB();
    const service = await ServiceModel.findById(id);
    if (!service) {
      return fail("NOT_FOUND", "Service not found", 404);
    }
    if (service.barberId !== result.clerkId) {
      return fail("FORBIDDEN", "Forbidden", 403);
    }

    service.isActive = false;
    await service.save();

    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (err) {
    return handleRouteError("services/id DELETE", err);
  }
}
