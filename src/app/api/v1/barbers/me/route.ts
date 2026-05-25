import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BarberModel } from "@/lib/models/Barber";
import { requireBarber } from "@/lib/auth";

function serializeBarber(b: InstanceType<typeof BarberModel>) {
  return {
    id: b._id.toString(),
    clerkId: b.clerkId,
    shopId: b.shopId?.toString(),
    role: b.role,
    name: b.name,
    email: b.email,
    shopName: b.shopName,
    slug: b.slug,
    phone: b.phone,
    address: b.address,
    bio: b.bio,
    profileImage: b.profileImage,
    images: b.images,
    city: b.city,
    businessHours: b.businessHours,
  };
}

// GET /api/v1/barbers/me
export async function GET() {
  const result = await requireBarber();
  if ("error" in result) return result.error;

  return NextResponse.json({ success: true, data: serializeBarber(result.barber) });
}

// PUT /api/v1/barbers/me
export async function PUT(request: NextRequest) {
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    const body = await request.json();
    await connectDB();

    const allowedFields = ["shopName", "phone", "address", "bio", "businessHours", "city", "profileImage", "images"];
    const update: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const updated = await BarberModel.findByIdAndUpdate(
      result.barber._id,
      { $set: update },
      { new: true }
    );

    return NextResponse.json({ success: true, data: serializeBarber(updated!) });
  } catch (err) {
    console.error("[barbers/me PUT]", err);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
