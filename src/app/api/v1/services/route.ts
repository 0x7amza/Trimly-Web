import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ServiceModel } from "@/lib/models/Service";
import { requireBarber } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { isPositiveInt, sanitizeString } from "@/lib/validation";

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
    const cleanName = sanitizeString(name, 120);
    const cleanCategory = sanitizeString(category, 80);
    if (
      !cleanName ||
      !isPositiveInt(price, 0, 10_000_000) ||
      !isPositiveInt(durationMinutes, 5, 12 * 60)
    ) {
      return fail("VALIDATION_ERROR", "Valid name, price, and duration are required", 400);
    }

    await connectDB();
    const service = await ServiceModel.create({
      barberId: result.clerkId,
      name: cleanName,
      price,
      durationMinutes,
      category: cleanCategory,
    });

    return NextResponse.json({ success: true, data: serializeService(service) }, { status: 201 });
  } catch (err) {
    return handleRouteError("services POST", err);
  }
}
