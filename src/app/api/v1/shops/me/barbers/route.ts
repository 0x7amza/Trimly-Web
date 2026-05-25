import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { BarberModel } from "@/lib/models/Barber";
import { requireOwner } from "@/lib/auth";

// POST /api/v1/shops/me/barbers
// Adds a barber to the shop. The barber MUST already exist in the system (synced via Clerk)
export async function POST(request: NextRequest) {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  try {
    const { barberEmail, barberName } = await request.json();
    if (!barberEmail) {
      return NextResponse.json({ success: false, error: "barberEmail required" }, { status: 400 });
    }

    await connectDB();

    // Find the shop owned by this owner
    const shop = await ShopModel.findOne({ ownerId: result.clerkId });
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    // Find the barber by email
    let barber = await BarberModel.findOne({ email: barberEmail });

    if (!barber) {
      // Barber not yet synced — create a placeholder record
      // They'll complete their profile on first sign-in
      barber = await BarberModel.create({
        clerkId: `pending_${Date.now()}`, // placeholder until they sign in
        shopId: shop._id,
        role: "BARBER",
        name: barberName || barberEmail.split("@")[0],
        email: barberEmail,
        slug: shop.slug,
        shopName: shop.name,
      });
    } else {
      // Barber exists — link them to this shop
      if (barber.shopId && barber.shopId.toString() !== shop._id.toString()) {
        return NextResponse.json(
          { success: false, error: "This barber is already linked to another shop" },
          { status: 409 }
        );
      }
      barber.shopId = shop._id;
      barber.role = "BARBER";
      barber.slug = shop.slug;
      barber.shopName = shop.name;
      await barber.save();
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: barber._id.toString(),
          clerkId: barber.clerkId,
          name: barber.name,
          email: barber.email,
          role: barber.role,
          shopId: barber.shopId?.toString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[shops/me/barbers POST]", err);
    return NextResponse.json({ success: false, error: "Failed to add barber" }, { status: 500 });
  }
}
