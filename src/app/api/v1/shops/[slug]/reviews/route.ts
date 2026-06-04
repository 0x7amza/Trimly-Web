import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { ReviewModel } from "@/lib/models/Review";
import { fail, handleRouteError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { isSlug, sanitizeString } from "@/lib/validation";

// GET /api/v1/shops/[slug]/reviews — fetch all reviews for a shop by slug
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!isSlug(slug)) {
    return fail("BAD_REQUEST", "Invalid shop slug", 400);
  }

  try {
    await connectDB();
    const shop = await ShopModel.findOne({ slug }).lean();
    if (!shop) {
      return fail("NOT_FOUND", "Shop not found", 404);
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
    return handleRouteError("reviews GET", err);
  }
}

// POST /api/v1/shops/[slug]/reviews — create a new review for a shop by slug
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const limited = rateLimit(request, "reviews:create", { limit: 5, windowMs: 10 * 60 * 1000, identity: slug });
  if (limited) return limited;

  if (!isSlug(slug)) {
    return fail("BAD_REQUEST", "Invalid shop slug", 400);
  }

  try {
    const { customerName, rating, comment } = await request.json();
    const cleanName = sanitizeString(customerName, 120);
    const cleanComment = sanitizeString(comment, 1000);
    const numericRating = Number(rating);
    
    if (!cleanName || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return fail("BAD_REQUEST", "Name and rating from 1 to 5 are required", 400);
    }

    await connectDB();
    const shop = await ShopModel.findOne({ slug });
    if (!shop) {
      return fail("NOT_FOUND", "Shop not found", 404);
    }

    const review = await ReviewModel.create({
      shopId: shop._id,
      customerName: cleanName,
      rating: numericRating,
      comment: cleanComment,
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
    return handleRouteError("reviews POST", err);
  }
}
