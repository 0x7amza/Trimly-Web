import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { ReviewModel } from "@/lib/models/Review";
import { fail, handleRouteError } from "@/lib/api-response";
import { parsePagination, sanitizeString } from "@/lib/validation";

type ShopSearchFilter = Partial<Record<"city" | "country" | "state" | "name", { $regex: RegExp }>>;

function escapedRegex(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

// GET /api/v1/search?city=&country=&state=&searchQuery=&page=1&limit=10
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = sanitizeString(searchParams.get("city"), 80);
  const country = sanitizeString(searchParams.get("country"), 80);
  const state = sanitizeString(searchParams.get("state"), 80);
  const searchQuery = sanitizeString(searchParams.get("searchQuery"), 120);
  const { page, limit } = parsePagination(searchParams);

  if (Number.isNaN(page) || Number.isNaN(limit)) {
    return fail("BAD_REQUEST", "Invalid pagination parameters", 400);
  }

  try {
    await connectDB();

    // Build MongoDB filter
    const filter: ShopSearchFilter = {};

    if (city) {
      filter.city = { $regex: escapedRegex(city) };
    }
    if (country) {
      filter.country = { $regex: escapedRegex(country) };
    }
    if (state) {
      filter.state = { $regex: escapedRegex(state) };
    }
    if (searchQuery) {
      filter.name = { $regex: escapedRegex(searchQuery) };
    }

    const total = await ShopModel.countDocuments(filter);
    const shops = await ShopModel.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch distinct active cities/states
    const citiesFilter: Pick<ShopSearchFilter, "country"> = {};
    if (country) {
      citiesFilter.country = { $regex: escapedRegex(country) };
    }
    const rawCities = await ShopModel.distinct("city", citiesFilter);
    const activeCities = rawCities.filter(Boolean);

    // Fetch reviews for matched shops to calculate real rating statistics
    const shopIds = shops.map((s) => s._id);
    const reviews = await ReviewModel.find({ shopId: { $in: shopIds } }).lean();

    // Group reviews by shopId
    const reviewsByShop: Record<string, { total: number; sum: number }> = {};
    for (const r of reviews) {
      const sId = r.shopId.toString();
      if (!reviewsByShop[sId]) {
        reviewsByShop[sId] = { total: 0, sum: 0 };
      }
      reviewsByShop[sId].total += 1;
      reviewsByShop[sId].sum += r.rating;
    }

    const results = shops.map((s) => {
      const sId = s._id.toString();
      const shopReviews = reviewsByShop[sId] || { total: 0, sum: 0 };
      const avgRating = shopReviews.total > 0 ? Number((shopReviews.sum / shopReviews.total).toFixed(1)) : 0;
      return {
        type: "shop",
        id: sId,
        name: s.name,
        slug: s.slug,
        profileImage: s.profileImage || s.profilePicture,
        images: s.images?.length ? s.images : s.galleryPictures,
        country: s.country,
        state: s.state,
        city: s.city,
        address: s.address,
        avgRating,
        totalReviews: shopReviews.total,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        cities: activeCities,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    return handleRouteError("search", err);
  }
}
