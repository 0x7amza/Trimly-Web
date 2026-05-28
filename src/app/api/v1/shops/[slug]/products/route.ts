import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";
import { ShopModel } from "@/lib/models/Shop";
import { requireBarber } from "@/lib/auth";

// Helper to serialize product
function serializeProduct(prod: any) {
  return {
    id: prod._id.toString(),
    shopId: prod.shopId.toString(),
    name: prod.name,
    description: prod.description || "",
    price: prod.price,
    imageUrl: prod.imageUrl || "",
    isActive: prod.isActive ?? true,
  };
}

// GET /api/v1/shops/[slug]/products
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    await connectDB();

    const queryConditions: any[] = [{ slug }];
    if (mongoose.Types.ObjectId.isValid(slug)) {
      queryConditions.push({ _id: slug });
    }

    const shop = await ShopModel.findOne({ $or: queryConditions });
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    const products = await ProductModel.find({ shopId: shop._id });
    return NextResponse.json({
      success: true,
      data: products.map(serializeProduct),
    });
  } catch (err) {
    console.error("[products GET]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/v1/shops/[slug]/products
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Authenticate user
  const result = await requireBarber();
  if ("error" in result) return result.error;

  try {
    await connectDB();

    const queryConditions: any[] = [{ slug }];
    if (mongoose.Types.ObjectId.isValid(slug)) {
      queryConditions.push({ _id: slug });
    }

    const shop = await ShopModel.findOne({ $or: queryConditions });
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    // Read payload supporting both JSON and multipart/form-data
    let name = "";
    let description = "";
    let price = 0;
    let imageUrl = "";
    let isActive = true;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = formData.get("name") as string || "";
      description = formData.get("description") as string || "";
      const priceVal = formData.get("price");
      price = priceVal ? Math.round(parseFloat(priceVal as string)) : 0;
      imageUrl = formData.get("imageUrl") as string || "";
      const activeVal = formData.get("isActive");
      if (activeVal !== null) {
        isActive = activeVal === "true" || activeVal === "1";
      }
    } else {
      const body = await request.json();
      name = body.name || "";
      description = body.description || "";
      price = body.price || 0;
      imageUrl = body.imageUrl || "";
      if (body.isActive !== undefined) {
        isActive = !!body.isActive;
      }
    }

    if (!name) {
      return NextResponse.json({ success: false, error: "Product name required" }, { status: 400 });
    }
    if (price <= 0) {
      return NextResponse.json({ success: false, error: "Price must be greater than zero" }, { status: 400 });
    }

    const product = await ProductModel.create({
      shopId: shop._id,
      name,
      description,
      price,
      imageUrl,
      isActive,
    });

    return NextResponse.json({
      success: true,
      data: serializeProduct(product),
    });
  } catch (err) {
    console.error("[products POST]", err);
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}
