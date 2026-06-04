import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { BarberModel } from "@/lib/models/Barber";
import { requireClerkAuth } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { isTimeZone, sanitizeString } from "@/lib/validation";

const RESERVED_SLUGS = ["dashboard", "billing", "api", "admin", "settings", "auth", "discover", "tarifs"];

// POST /api/v1/shops  — create a new shop
export async function POST(request: NextRequest) {
  const userIdOrError = await requireClerkAuth();
  if (userIdOrError instanceof NextResponse) return userIdOrError;

  try {
    const { name, country, state, timezone } = await request.json();
    const cleanName = sanitizeString(name, 120);
    const cleanCountry = sanitizeString(country, 80);
    const cleanState = sanitizeString(state, 120);
    const cleanTimezone = timezone === undefined ? "UTC" : timezone;
    if (!cleanName) {
      return fail("VALIDATION_ERROR", "Shop name required", 400);
    }
    if (!cleanCountry || !cleanState) {
      return fail("VALIDATION_ERROR", "Country and State/Governorate are required", 400);
    }
    if (!isTimeZone(cleanTimezone)) {
      return fail("VALIDATION_ERROR", "Please choose a valid IANA timezone", 400);
    }

    await connectDB();

    // One shop per owner
    const existing = await ShopModel.findOne({ ownerId: userIdOrError });
    if (existing) {
      return fail("CONFLICT", "You already have a shop", 409);
    }

    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (RESERVED_SLUGS.includes(slug)) {
      return fail("VALIDATION_ERROR", "This name conflicts with a reserved system route", 400);
    }

    // Check slug uniqueness
    const slugExists = await ShopModel.findOne({ slug });
    const finalSlug = slugExists ? `${slug}-${Date.now().toString(36)}` : slug;

    // Create shop (14-day trial)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const shop = await ShopModel.create({
      ownerId: userIdOrError,
      name: cleanName,
      slug: finalSlug,
      country: cleanCountry,
      state: cleanState,
      city: cleanState,
      timezone: cleanTimezone,
      subscription: { plan: "NONE", status: "TRIALING", trialEndsAt },
      maxBarbersIncluded: 5,
    });

    // Update the barber record with shopId + OWNER role
    await BarberModel.findOneAndUpdate(
      { clerkId: userIdOrError },
      { shopId: shop._id, role: "OWNER", slug: finalSlug, shopName: cleanName },
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
          timezone: shop.timezone,
          subscription: shop.subscription,
          maxBarbersIncluded: shop.maxBarbersIncluded,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleRouteError("shops POST", err);
  }
}
