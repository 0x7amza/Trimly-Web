import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { BarberModel } from "@/lib/models/Barber";
import { requireBarber, requireOwner } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { isBusinessHours, isTimeZone } from "@/lib/validation";

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
  let cleanUrl = url.trim();

  // If iframe format, extract the src URL
  if (cleanUrl.includes("<iframe")) {
    const match = cleanUrl.match(/src="([^"]+)"/);
    if (match && match[1]) {
      cleanUrl = match[1];
    }
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

  return cleanUrl;
}

// PUT /api/v1/shops/me
export async function PUT(request: NextRequest) {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  try {
    const body = await request.json();
    await connectDB();

    const allowedFields = ["name", "profileImage", "profilePicture", "images", "galleryPictures", "mapUrl", "googleMapsUrl", "country", "state", "city", "address", "timezone", "businessHours"];
    const update: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (update.timezone !== undefined && !isTimeZone(update.timezone)) {
      return fail("VALIDATION_ERROR", "Please choose a valid IANA timezone", 400);
    }
    if (update.businessHours !== undefined && !isBusinessHours(update.businessHours)) {
      return fail("VALIDATION_ERROR", "Opening hours must contain valid, non-overlapping daily time ranges", 400);
    }

    if (update.googleMapsUrl !== undefined) {
      const sanitized = await sanitizeAndResolveMapUrl(update.googleMapsUrl as string | undefined);
      update.googleMapsUrl = sanitized;
      update.mapUrl = sanitized; // Sync for backward compatibility
    } else if (update.mapUrl !== undefined) {
      const sanitized = await sanitizeAndResolveMapUrl(update.mapUrl as string | undefined);
      update.mapUrl = sanitized;
      update.googleMapsUrl = sanitized; // Sync
    }

    // Auto-sync city with state update
    if (update.state) {
      update.city = update.state;
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

    const shop = await ShopModel.findOneAndUpdate(
      { $or: [{ ownerId: result.clerkId }, { _id: result.barber.shopId }] },
      { $set: update },
      { new: true }
    );

    if (!shop) {
      return fail("NOT_FOUND", "Shop not found", 404);
    }

    return NextResponse.json({ success: true, data: serializeShop(shop) });
  } catch (err) {
    return handleRouteError("shops/me PUT", err);
  }
}
