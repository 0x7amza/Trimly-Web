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

// PUT /api/v1/shops/[slug]/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;

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

    // Verify barber is associated with this shop
    if (result.barber.shopId?.toString() !== shop._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You do not belong to this shop." },
        { status: 403 }
      );
    }

    const product = await ProductModel.findOne({ _id: id, shopId: shop._id });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // Read payload supporting both JSON and multipart/form-data
    let name = product.name;
    let description = product.description;
    let price = product.price;
    let imageUrl = product.imageUrl;
    let isActive = product.isActive;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const nameVal = formData.get("name");
      if (nameVal !== null) name = nameVal as string;
      const descVal = formData.get("description");
      if (descVal !== null) description = descVal as string;
      const priceVal = formData.get("price");
      if (priceVal !== null) price = Math.round(parseFloat(priceVal as string));
      const imageVal = formData.get("imageUrl");
      if (imageVal !== null) imageUrl = imageVal as string;
      const activeVal = formData.get("isActive");
      if (activeVal !== null) {
        isActive = activeVal === "true" || activeVal === "1";
      }
    } else {
      const body = await request.json();
      if (body.name !== undefined) name = body.name;
      if (body.description !== undefined) description = body.description;
      if (body.price !== undefined) price = body.price;
      if (body.imageUrl !== undefined) imageUrl = body.imageUrl;
      if (body.isActive !== undefined) isActive = !!body.isActive;
    }

    if (!name) {
      return NextResponse.json({ success: false, error: "Product name required" }, { status: 400 });
    }
    if (price <= 0) {
      return NextResponse.json({ success: false, error: "Price must be greater than zero" }, { status: 400 });
    }

    product.name = name;
    product.description = description;
    product.price = price;
    product.imageUrl = imageUrl;
    product.isActive = isActive;

    await product.save();

    return NextResponse.json({
      success: true,
      data: serializeProduct(product),
    });
  } catch (err) {
    console.error("[product PUT]", err);
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/v1/shops/[slug]/products/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;

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

    // Verify barber is associated with this shop
    if (result.barber.shopId?.toString() !== shop._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Forbidden. You do not belong to this shop." },
        { status: 403 }
      );
    }

    const product = await ProductModel.findOneAndDelete({ _id: id, shopId: shop._id });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("[product DELETE]", err);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
