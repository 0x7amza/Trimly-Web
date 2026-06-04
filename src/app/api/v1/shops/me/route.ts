import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { BarberModel } from "@/lib/models/Barber";
import { requireBarber, requireOwner } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { isBusinessHours, isTimeZone } from "@/lib/validation";
import { COUNTRIES } from "@/lib/locations";
import { sanitizeMapInput, extractGoogleMapsEmbedSrc } from "@/lib/utils";

function serializeShop(shop: InstanceType<typeof ShopModel>) {
  return {
    id: shop._id.toString(),
    ownerId: shop.ownerId,
    name: shop.name,
    slug: shop.slug,
    subscription: {
      plan: shop.subscription?.plan,
      status: shop.subscription?.status,
      stripeCustomerId: shop.subscription?.stripeCustomerId,
      stripeSubscriptionId: shop.subscription?.stripeSubscriptionId,
      currentPeriodEnd: shop.subscription?.currentPeriodEnd?.toISOString(),
      trialEndsAt: shop.subscription?.trialEndsAt?.toISOString(),
      gracePeriodEndsAt: shop.subscription?.gracePeriodEndsAt?.toISOString(),
    },
    maxBarbersIncluded: shop.maxBarbersIncluded,
    profileImage: shop.profileImage,
    profilePicture: shop.profilePicture,
    images: shop.images,
    galleryPictures: shop.galleryPictures,
    mapUrl: shop.mapUrl,
    googleMapsUrl: shop.googleMapsUrl,
    country: shop.country,
    state: shop.state,
    city: shop.city,
    address: shop.address,
    timezone: shop.timezone || "UTC",
    businessHours: shop.businessHours,
  };
}

function serializeBarber(b: InstanceType<typeof BarberModel>) {
  return {
    id: b._id.toString(),
    clerkId: b.clerkId,
    shopId: b.shopId?.toString(),
    role: b.role,
    name: b.name,
    email: b.email,
    phone: b.phone,
    bio: b.bio,
    profileImage: b.profileImage,
    city: b.city,
    businessHours: b.businessHours,
    slug: b.slug,
    shopName: b.shopName,
  };
}

// GET /api/v1/shops/me
export async function GET() {
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    await connectDB();

    const shop = await ShopModel.findOne({
      $or: [
        { ownerId: result.clerkId },
        { _id: result.barber.shopId },
      ],
    });

    if (!shop) {
      return fail("NOT_FOUND", "Shop not found", 404);
    }

    const barbers = await BarberModel.find({ shopId: shop._id });

    return NextResponse.json({
      success: true,
      data: { shop: serializeShop(shop), barbers: barbers.map(serializeBarber) },
    });
  } catch (err) {
    return handleRouteError("shops/me GET", err);
  }
}

async function sanitizeAndResolveMapUrl(url: string | undefined): Promise<string | undefined> {
  if (!url) return url;
  const sanitized = sanitizeMapInput(url);
  if (!sanitized) return undefined;

  let cleanUrl = sanitized;
  if (sanitized.startsWith("<iframe")) {
    const src = extractGoogleMapsEmbedSrc(sanitized);
    if (!src) return undefined;
    cleanUrl = src;
  }

  // Double check unsafe schemes
  const lower = cleanUrl.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || /<script/i.test(cleanUrl) || /on\w+\s*=/i.test(cleanUrl)) {
    return undefined;
  }

  // Resolve short google maps URL to long format via server-side fetch redirects
  if (cleanUrl.includes("maps.app.goo.gl") || cleanUrl.includes("goo.gl/maps")) {
    try {
      const response = await fetch(cleanUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.url && response.url !== cleanUrl) {
        cleanUrl = response.url;
      }
    } catch (err) {
      console.error("Error resolving short Google Maps URL:", err);
      try {
        const response = await fetch(cleanUrl, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (response.url && response.url !== cleanUrl) {
          cleanUrl = response.url;
        }
      } catch (err2) {
        console.error("Secondary resolve attempt failed:", err2);
      }
    }
  }

  const finalSanitized = sanitizeMapInput(cleanUrl);
  return finalSanitized || undefined;
}

// PUT /api/v1/shops/me
export async function PUT(request: NextRequest) {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  try {
    const body = await request.json();
    await connectDB();

    const shop = await ShopModel.findOne({
      $or: [{ ownerId: result.clerkId }, { _id: result.barber.shopId }]
    });
    if (!shop) {
      return fail("NOT_FOUND", "Shop not found", 404);
    }

    const allowedFields = ["name", "profileImage", "profilePicture", "images", "galleryPictures", "mapUrl", "googleMapsUrl", "country", "state", "city", "address", "timezone", "businessHours"];
    const update: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    // Validation
    if (update.name !== undefined && (typeof update.name !== "string" || !update.name.trim())) {
      return fail("VALIDATION_ERROR", "Salon name must be a valid non-empty string", 400);
    }

    if (update.country !== undefined) {
      if (typeof update.country !== "string" || !update.country.trim()) {
        return fail("VALIDATION_ERROR", "Country is required", 400);
      }
      const countryValid = COUNTRIES.some(c => c.name.toLowerCase() === (update.country as string).trim().toLowerCase());
      if (!countryValid) {
        return fail("VALIDATION_ERROR", "Invalid country selected", 400);
      }
    }

    if (update.state !== undefined) {
      if (typeof update.state !== "string" || !update.state.trim()) {
        return fail("VALIDATION_ERROR", "State / Governorate is required", 400);
      }
      const targetCountry = (update.country !== undefined ? update.country : shop.country) as string;
      const countryData = COUNTRIES.find(c => c.name.toLowerCase() === targetCountry?.toLowerCase());
      if (!countryData || !countryData.states.some(s => s.toLowerCase() === (update.state as string).trim().toLowerCase())) {
        return fail("VALIDATION_ERROR", "Invalid state/governorate selected for the given country", 400);
      }
    }

    if (update.city !== undefined && (typeof update.city !== "string" || !update.city.trim())) {
      return fail("VALIDATION_ERROR", "City must be a valid string", 400);
    }

    if (update.address !== undefined && typeof update.address !== "string") {
      return fail("VALIDATION_ERROR", "Address must be a valid string", 400);
    }

    if (update.timezone !== undefined && !isTimeZone(update.timezone)) {
      return fail("VALIDATION_ERROR", "Please choose a valid IANA timezone", 400);
    }
    if (update.businessHours !== undefined && !isBusinessHours(update.businessHours)) {
      return fail("VALIDATION_ERROR", "Opening hours must contain valid, non-overlapping daily time ranges", 400);
    }

    if (update.googleMapsUrl !== undefined) {
      if (update.googleMapsUrl) {
        const sanitized = await sanitizeAndResolveMapUrl(update.googleMapsUrl as string);
        if (!sanitized) {
          return fail("VALIDATION_ERROR", "Invalid or unsupported Google Maps link or iframe code. Please verify and try again.", 400);
        }
        update.googleMapsUrl = sanitized;
        update.mapUrl = sanitized;
      } else {
        update.googleMapsUrl = "";
        update.mapUrl = "";
      }
    } else if (update.mapUrl !== undefined) {
      if (update.mapUrl) {
        const sanitized = await sanitizeAndResolveMapUrl(update.mapUrl as string);
        if (!sanitized) {
          return fail("VALIDATION_ERROR", "Invalid or unsupported Google Maps link or iframe code. Please verify and try again.", 400);
        }
        update.mapUrl = sanitized;
        update.googleMapsUrl = sanitized;
      } else {
        update.mapUrl = "";
        update.googleMapsUrl = "";
      }
    }

    // Sync profile picture fields
    if (update.profilePicture && !update.profileImage) {
      update.profileImage = update.profilePicture;
    } else if (update.profileImage && !update.profilePicture) {
      update.profilePicture = update.profileImage;
    }

    // Sync gallery images fields
    if (update.galleryPictures && !update.images) {
      update.images = update.galleryPictures;
    } else if (update.images && !update.galleryPictures) {
      update.galleryPictures = update.images;
    }

    const updatedShop = await ShopModel.findOneAndUpdate(
      { _id: shop._id },
      { $set: update },
      { new: true }
    );

    if (!updatedShop) {
      return fail("NOT_FOUND", "Shop not found", 404);
    }

    return NextResponse.json({ success: true, data: serializeShop(updatedShop) });
  } catch (err) {
    return handleRouteError("shops/me PUT", err);
  }
}
