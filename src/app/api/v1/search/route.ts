import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { ReviewModel } from "@/lib/models/Review";

// GET /api/v1/search?city=&country=&state=&searchQuery=&page=1&limit=10
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const country = searchParams.get("country");
  const state = searchParams.get("state");
  const searchQuery = searchParams.get("searchQuery");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Number(searchParams.get("limit") || "12"));

  try {
    await connectDB();

    // Build MongoDB filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (city) {
      filter.city = { $regex: new RegExp(city, "i") };
    }
    if (country) {
      filter.country = { $regex: new RegExp(country, "i") };
    }
    if (state) {
      filter.state = { $regex: new RegExp(state, "i") };
    }
    if (searchQuery) {
      filter.name = { $regex: new RegExp(searchQuery, "i") };
    }

    const total = await ShopModel.countDocuments(filter);
    const shops = await ShopModel.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch distinct active cities/states
    const citiesFilter: Record<string, any> = {};
    if (country) {
      citiesFilter.country = { $regex: new RegExp(country, "i") };
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
        profileImage: s.profileImage || (s as any).profilePicture,
        images: s.images?.length ? s.images : (s as any).galleryPictures,
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
    console.error("[search]", err);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
