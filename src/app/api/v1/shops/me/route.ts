import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { BarberModel } from "@/lib/models/Barber";
import { requireBarber } from "@/lib/auth";

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
    industryType: shop.industryType,
    city: shop.city,
    address: shop.address,
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
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    const barbers = await BarberModel.find({ shopId: shop._id });

    return NextResponse.json({
      success: true,
      data: { shop: serializeShop(shop), barbers: barbers.map(serializeBarber) },
    });
  } catch (err) {
    console.error("[shops/me GET]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch shop" }, { status: 500 });
  }
}

// PUT /api/v1/shops/me
export async function PUT(request: NextRequest) {
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    const body = await request.json();
    await connectDB();

    const allowedFields = ["name", "profileImage", "profilePicture", "images", "galleryPictures", "mapUrl", "industryType", "city", "address", "businessHours"];
    const update: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) update[key] = body[key];
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
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeShop(shop) });
  } catch (err) {
    console.error("[shops/me PUT]", err);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
