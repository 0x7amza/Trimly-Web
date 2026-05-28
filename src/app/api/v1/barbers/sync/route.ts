import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BarberModel } from "@/lib/models/Barber";
import { requireClerkAuth } from "@/lib/auth";

// POST /api/v1/barbers/sync
// Syncs Clerk user to our barbers collection on first sign-in
export async function POST(request: NextRequest) {
  const userIdOrError = await requireClerkAuth();
  if (userIdOrError instanceof NextResponse) return userIdOrError;

  try {
    const { name, email, shopId } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email required" }, { status: 400 });
    }

    await connectDB();

    // Safely attempt to drop the unique slug index if it exists in the collection
    try {
      await BarberModel.collection.dropIndex("slug_1");
    } catch {
      // Index didn't exist or was already dropped, ignore
    }

    // 1. Try to find by clerkId
    let barber = await BarberModel.findOne({ clerkId: userIdOrError });

    if (!barber) {
      // 2. Try to find pending barber by email
      barber = await BarberModel.findOne({ email });

      if (barber) {
        // If a pending barber exists, claim this record with the real clerkId
        barber.clerkId = userIdOrError;
        barber.name = name;
        if (shopId) {
          barber.shopId = shopId;
          barber.role = "BARBER";
        }
        await barber.save();
      } else {
        // 3. Otherwise, create profile
        const targetRole = shopId ? "BARBER" : "OWNER";
        barber = await BarberModel.create({
          clerkId: userIdOrError,
          role: targetRole,
          name,
          email,
          shopId: shopId || undefined,
        });
      }
    } else {
      // Update name/email if they changed on Clerk side
      barber.name = name;
      barber.email = email;
      if (shopId) {
        barber.shopId = shopId;
        barber.role = "BARBER";
      }
      await barber.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        id: barber._id.toString(),
        clerkId: barber.clerkId,
        shopId: barber.shopId?.toString(),
        role: barber.role,
        name: barber.name,
        email: barber.email,
      },
    });
  } catch (err) {
    console.error("[barbers/sync]", err);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}

