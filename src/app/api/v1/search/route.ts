import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";

// GET /api/v1/search?city=&industryType=&searchQuery=&page=1&limit=10
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const industryType = searchParams.get("industryType");
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
    if (industryType) {
      filter.industryType = { $regex: new RegExp(industryType, "i") };
    }
    if (searchQuery) {
      filter.name = { $regex: new RegExp(searchQuery, "i") };
    }

    const total = await ShopModel.countDocuments(filter);
    const shops = await ShopModel.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch distinct active cities for this category/industryType
    const citiesFilter: Record<string, any> = {};
    if (industryType) {
      citiesFilter.industryType = { $regex: new RegExp(industryType, "i") };
    }
    const rawCities = await ShopModel.distinct("city", citiesFilter);
    const activeCities = rawCities.filter(Boolean);

    const results = shops.map((s) => ({
      type: "shop",
      id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      profileImage: s.profileImage || (s as any).profilePicture,
      images: s.images?.length ? s.images : (s as any).galleryPictures,
      industryType: s.industryType,
      city: s.city,
      address: s.address,
    }));

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
