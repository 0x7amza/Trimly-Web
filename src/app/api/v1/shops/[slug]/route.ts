import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { BarberModel } from "@/lib/models/Barber";

// GET /api/v1/shops/[slug]  — public endpoint
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    await connectDB();
    const shop = await ShopModel.findOne({ slug }).lean();
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    const barbers = await BarberModel.find({ shopId: shop._id }).lean();

    return NextResponse.json({
      success: true,
      data: {
        shop: {
          id: shop._id.toString(),
          ownerId: shop.ownerId,
          name: shop.name,
          slug: shop.slug,
          profileImage: shop.profileImage,
          profilePicture: shop.profilePicture,
          images: shop.images,
          galleryPictures: shop.galleryPictures,
          mapUrl: shop.mapUrl,
          industryType: shop.industryType,
          city: shop.city,
          address: shop.address,
          businessHours: shop.businessHours,
          maxBarbersIncluded: shop.maxBarbersIncluded,
          subscription: {
            plan: shop.subscription?.plan,
            status: shop.subscription?.status,
          },
        },
        barbers: barbers.map((b) => ({
          id: b._id.toString(),
          clerkId: b.clerkId,
          name: b.name,
          email: b.email,
          role: b.role,
          bio: b.bio,
          profileImage: b.profileImage,
          images: b.images,
          city: b.city,
          businessHours: b.businessHours,
          slug: b.slug,
          shopName: b.shopName,
        })),
      },
    });
  } catch (err) {
    console.error("[shops/slug]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch shop" }, { status: 500 });
  }
}
