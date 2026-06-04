import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { requireClerkAuth } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { connectDB } from "@/lib/db";
import { BarberModel } from "@/lib/models/Barber";
import { ShopModel } from "@/lib/models/Shop";
import { isEmail, sanitizeString } from "@/lib/validation";

function isDuplicateKeyError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000
  );
}

function escapedRegex(value: string) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

// POST /api/v1/barbers/sync
// Syncs Clerk user to the local barbers collection on sign-in or identity change.
export async function POST(request: NextRequest) {
  const userIdOrError = await requireClerkAuth();
  if (userIdOrError instanceof NextResponse) return userIdOrError;

  const clerkId = userIdOrError;

  let body: { name?: unknown; email?: unknown; shopId?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Request body must be valid JSON.", 400);
  }

  const name = sanitizeString(body.name, 120);
  const email = sanitizeString(body.email, 254).toLowerCase();
  const rawShopId = typeof body.shopId === "string" ? body.shopId.trim() : null;

  if (!name) {
    return fail("BAD_REQUEST", "Name is required for profile sync.", 400);
  }
  if (!isEmail(email)) {
    return fail("BAD_REQUEST", "A valid email is required for profile sync.", 400);
  }

  let shopObjectId: mongoose.Types.ObjectId | null = null;
  if (rawShopId) {
    if (!mongoose.Types.ObjectId.isValid(rawShopId)) {
      return fail("BAD_REQUEST", "Provided shopId is not a valid identifier.", 400);
    }
    shopObjectId = new mongoose.Types.ObjectId(rawShopId);
  }

  try {
    await connectDB();
  } catch (error) {
    console.error("[barbers/sync] DB connection failed:", error);
    return fail("INTERNAL_ERROR", "Database is temporarily unavailable. Please try again shortly.", 503);
  }

  try {
    if (shopObjectId) {
      const shopExists = await ShopModel.exists({ _id: shopObjectId });
      if (!shopExists) {
        shopObjectId = null;
        console.warn(`[barbers/sync] Invite shopId ${rawShopId} not found. Ignoring shop link.`);
      }
    }

    // Read the real identity first so an existing profile never claims an old
    // pending invite that happens to share its email address.
    let barber = await BarberModel.findOne({ clerkId });

    if (!barber) {
      // The invite route creates `pending_*` IDs. The other filters support
      // legacy pending records created before clerkId became required.
      try {
        barber = await BarberModel.findOneAndUpdate(
          {
            email: escapedRegex(email),
            $or: [
              { clerkId: /^pending_/ },
              { clerkId: { $exists: false } },
              { clerkId: null },
            ],
          },
          { $set: { clerkId, name, email } },
          { new: true, runValidators: true }
        );
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
        barber = await BarberModel.findOne({ clerkId });
      }
    }

    if (!barber) {
      // Upsert by the unique Clerk ID so concurrent first-sign-in requests are
      // idempotent. Duplicate-key recovery handles the narrow insert race.
      try {
        await BarberModel.updateOne(
          { clerkId },
          {
            $set: { name, email },
            $setOnInsert: {
              role: shopObjectId ? "BARBER" : "OWNER",
              ...(shopObjectId ? { shopId: shopObjectId } : {}),
            },
          },
          { upsert: true, runValidators: true }
        );
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }

      barber = await BarberModel.findOne({ clerkId });
      if (!barber) {
        throw new Error("Barber profile sync completed without a readable profile.");
      }
    } else {
      barber =
        (await BarberModel.findByIdAndUpdate(
          barber._id,
          { $set: { name, email } },
          { new: true, runValidators: true }
        )) ?? barber;
    }

    // Only attach an invite shop when the profile is not already linked.
    // A new invite link must never move an existing barber to another shop.
    if (shopObjectId && !barber.shopId) {
      barber =
        (await BarberModel.findOneAndUpdate(
          {
            _id: barber._id,
            $or: [{ shopId: { $exists: false } }, { shopId: null }],
          },
          { $set: { shopId: shopObjectId, role: "BARBER" } },
          { new: true, runValidators: true }
        )) ?? barber;
    }

    let shopName: string | undefined;
    if (barber.shopId) {
      const linkedShop = await ShopModel.findById(barber.shopId).select("name").lean();
      if (linkedShop) {
        shopName = linkedShop.name;
        if (barber.shopName !== linkedShop.name) {
          await BarberModel.updateOne(
            { _id: barber._id },
            { $set: { shopName: linkedShop.name } }
          );
          barber.shopName = linkedShop.name;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: barber._id.toString(),
        clerkId: barber.clerkId,
        shopId: barber.shopId?.toString() ?? null,
        shopName: shopName ?? barber.shopName ?? null,
        role: barber.role,
        name: barber.name,
        email: barber.email,
        profileImage: barber.profileImage ?? null,
      },
    });
  } catch (error) {
    return handleRouteError("barbers/sync", error);
  }
}
