import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";
import type { IProduct } from "@/lib/models/Product";
import { ShopModel } from "@/lib/models/Shop";
import { requireBarber } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { isObjectId, isPriceMinorUnit, isSlug, sanitizeString } from "@/lib/validation";

type ProductForResponse = Pick<IProduct, "name" | "description" | "price" | "imageUrl" | "isActive"> & {
  _id: { toString(): string };
  shopId: { toString(): string };
};
type ShopLookupCondition = { slug: string } | { _id: string };

// Helper to serialize product
function serializeProduct(prod: ProductForResponse) {
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

    if (!isSlug(slug) && !isObjectId(slug)) {
      return fail("BAD_REQUEST", "Invalid shop identifier", 400);
    }

    const queryConditions: ShopLookupCondition[] = [{ slug }];
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
    return handleRouteError("products GET", err);
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

    if (!isSlug(slug) && !isObjectId(slug)) {
      return fail("BAD_REQUEST", "Invalid shop identifier", 400);
    }

    const queryConditions: ShopLookupCondition[] = [{ slug }];
    if (mongoose.Types.ObjectId.isValid(slug)) {
      queryConditions.push({ _id: slug });
    }

    const shop = await ShopModel.findOne({ $or: queryConditions });
    if (!shop) {
      return fail("NOT_FOUND", "Shop not found", 404);
    }

    if (result.barber.shopId?.toString() !== shop._id.toString()) {
      return fail("FORBIDDEN", "Forbidden. You do not belong to this shop.", 403);
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
      name = sanitizeString(formData.get("name"), 120);
      description = sanitizeString(formData.get("description"), 1000);
      const priceVal = formData.get("price");
      price = priceVal ? Math.round(parseFloat(priceVal as string)) : 0;
      imageUrl = sanitizeString(formData.get("imageUrl"), 1000);
      const activeVal = formData.get("isActive");
      if (activeVal !== null) {
        isActive = activeVal === "true" || activeVal === "1";
      }
    } else {
      const body = await request.json();
      name = sanitizeString(body.name, 120);
      description = sanitizeString(body.description, 1000);
      price = body.price || 0;
      imageUrl = sanitizeString(body.imageUrl, 1000);
      if (body.isActive !== undefined) {
        isActive = !!body.isActive;
      }
    }

    if (!name) {
      return fail("BAD_REQUEST", "Product name required", 400);
    }
    if (!isPriceMinorUnit(price)) {
      return fail("BAD_REQUEST", "Price must be a positive minor-unit integer", 400);
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
    return handleRouteError("products POST", err);
  }
}
