import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { ReviewModel } from "@/lib/models/Review";

// GET /api/v1/shops/[slug]/reviews — fetch all reviews for a shop by slug
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

    const reviews = await ReviewModel.find({ shopId: shop._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: reviews.map(r => ({
        id: r._id.toString(),
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[reviews GET]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/v1/shops/[slug]/reviews — create a new review for a shop by slug
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const { customerName, rating, comment } = await request.json();
    
    if (!customerName || !rating) {
      return NextResponse.json({ success: false, error: "Name and rating required" }, { status: 400 });
    }

    await connectDB();
    const shop = await ShopModel.findOne({ slug });
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    const review = await ReviewModel.create({
      shopId: shop._id,
      customerName,
      rating: Number(rating),
      comment: comment || "",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: review._id.toString(),
        customerName: review.customerName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[reviews POST]", err);
    return NextResponse.json({ success: false, error: "Failed to save review" }, { status: 500 });
  }
}
