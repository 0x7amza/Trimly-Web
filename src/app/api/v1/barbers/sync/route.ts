import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { BarberModel } from "@/lib/models/Barber";
import { ShopModel } from "@/lib/models/Shop";
import { requireClerkAuth } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";

// POST /api/v1/barbers/sync
// Syncs Clerk user to our barbers collection on first sign-in or when identity changes.
export async function POST(request: NextRequest) {
  // 1. Auth check — must be a valid Clerk session
  const userIdOrError = await requireClerkAuth();
  if (userIdOrError instanceof NextResponse) return userIdOrError;

  const clerkId = userIdOrError;

  // 2. Parse and validate request body
  let body: { name?: unknown; email?: unknown; shopId?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Request body must be valid JSON.", 400);
  }

  const name  = typeof body.name  === "string" ? body.name.trim()  : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const rawShopId = typeof body.shopId === "string" ? body.shopId.trim() : null;

  if (!name) {
    return fail("BAD_REQUEST", "Name is required for profile sync.", 400);
  }
  if (!email) {
    return fail("BAD_REQUEST", "Email is required for profile sync.", 400);
  }

  // 3. Validate shopId if provided — must be a valid MongoDB ObjectId
  let shopObjectId: mongoose.Types.ObjectId | null = null;
  if (rawShopId) {
    if (!mongoose.Types.ObjectId.isValid(rawShopId)) {
      return fail("BAD_REQUEST", "Provided shopId is not a valid identifier.", 400);
    }
    shopObjectId = new mongoose.Types.ObjectId(rawShopId);
  }

  // 4. Connect to DB — surface a clean error if MongoDB is unreachable
  try {
    await connectDB();
  } catch (err) {
    console.error("[barbers/sync] DB connection failed:", err);
    return fail("INTERNAL_ERROR", "Database is temporarily unavailable. Please try again shortly.", 503);
  }

  try {
    // 5. If shopId was provided, verify the shop actually exists
    if (shopObjectId) {
      const shopExists = await ShopModel.exists({ _id: shopObjectId });
      if (!shopExists) {
        // Invalid invitation — ignore the shopId rather than crash
        shopObjectId = null;
        console.warn(`[barbers/sync] Invite shopId ${rawShopId} not found. Ignoring shop link.`);
      }
    }

    // 6. Try to find by clerkId first
    let barber = await BarberModel.findOne({ clerkId });

    if (!barber) {
      // 7. Try to claim a pending barber record (invited by email before signup)
      const pendingByEmail = await BarberModel.findOne({
        email,
        clerkId: { $exists: false },
      });

      if (pendingByEmail) {
        // Claim the pending record with the real Clerk identity
        pendingByEmail.clerkId = clerkId;
        pendingByEmail.name    = name;
        if (shopObjectId) {
          pendingByEmail.shopId = shopObjectId;
          pendingByEmail.role   = "BARBER";
        }
        await pendingByEmail.save();
        barber = pendingByEmail;
      } else {
        // 8. No existing record — create a new barber profile
        const targetRole = shopObjectId ? "BARBER" : "OWNER";
        barber = await BarberModel.create({
          clerkId,
          role: targetRole,
          name,
          email,
          ...(shopObjectId ? { shopId: shopObjectId } : {}),
        });
      }
    } else {
      // 9. Existing barber — update mutable fields
      barber.name  = name;
      barber.email = email;
      // Only override shopId/role if the user provided a valid invite link
      if (shopObjectId && !barber.shopId) {
        barber.shopId = shopObjectId;
        barber.role   = "BARBER";
      }
      await barber.save();
    }

    // 10. If this barber is an OWNER and has a shopId, sync shopName from DB
    let shopName: string | undefined;
    if (barber.shopId) {
      const linkedShop = await ShopModel.findById(barber.shopId).select("name slug").lean();
      if (linkedShop) {
        shopName = linkedShop.name;
        if (barber.shopName !== linkedShop.name) {
          barber.shopName = linkedShop.name;
          await barber.save();
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id:       barber._id.toString(),
        clerkId:  barber.clerkId,
        shopId:   barber.shopId?.toString() ?? null,
        shopName: shopName ?? barber.shopName ?? null,
        role:     barber.role,
        name:     barber.name,
        email:    barber.email,
        profileImage: barber.profileImage ?? null,
      },
    });
  } catch (err) {
    return handleRouteError("barbers/sync", err);
  }
}
