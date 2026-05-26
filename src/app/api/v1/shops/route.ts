import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { BarberModel } from "@/lib/models/Barber";
import { requireClerkAuth } from "@/lib/auth";

const RESERVED_SLUGS = ["dashboard", "billing", "api", "admin", "settings", "auth", "discover", "tarifs"];

// POST /api/v1/shops  — create a new shop
export async function POST(request: NextRequest) {
  const userIdOrError = await requireClerkAuth();
  if (userIdOrError instanceof NextResponse) return userIdOrError;

  try {
    const { name, country, state } = await request.json();
    if (!name) {
      return NextResponse.json({ success: false, error: "Shop name required" }, { status: 400 });
    }
    if (!country || !state) {
      return NextResponse.json({ success: false, error: "Country and State/Governorate are required" }, { status: 400 });
    }

    await connectDB();

    // One shop per owner
    const existing = await ShopModel.findOne({ ownerId: userIdOrError });
    if (existing) {
      return NextResponse.json({ success: false, error: "You already have a shop" }, { status: 409 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (RESERVED_SLUGS.includes(slug)) {
      return NextResponse.json({ success: false, error: "This name conflicts with a reserved system route" }, { status: 400 });
    }

    // Check slug uniqueness
    const slugExists = await ShopModel.findOne({ slug });
    const finalSlug = slugExists ? `${slug}-${Date.now().toString(36)}` : slug;

    // Create shop (14-day trial)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const shop = await ShopModel.create({
      ownerId: userIdOrError,
      name,
      slug: finalSlug,
      country,
      state,
      city: state,
      subscription: { plan: "NONE", status: "TRIALING", trialEndsAt },
      maxBarbersIncluded: 5,
    });

    // Update the barber record with shopId + OWNER role
    await BarberModel.findOneAndUpdate(
      { clerkId: userIdOrError },
      { shopId: shop._id, role: "OWNER", slug: finalSlug, shopName: name },
      { upsert: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: shop._id.toString(),
          ownerId: shop.ownerId,
          name: shop.name,
          slug: shop.slug,
          subscription: shop.subscription,
          maxBarbersIncluded: shop.maxBarbersIncluded,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[shops POST]", err);
    return NextResponse.json({ success: false, error: "Failed to create shop" }, { status: 500 });
  }
}
