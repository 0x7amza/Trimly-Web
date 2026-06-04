import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { requireOwner } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";
import { isProduction, isStripeServerConfigured } from "@/lib/env";

// POST /api/v1/shops/me/subscribe
export async function POST(request: NextRequest) {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  try {
    const { plan } = await request.json();
    const validPlans = ["MONTHLY", "YEARLY", "GROWTH_MONTHLY", "GROWTH_YEARLY", "PRO_MONTHLY", "PRO_YEARLY"];
    if (!validPlans.includes(plan)) {
      return fail("BAD_REQUEST", "Invalid plan", 400);
    }

    const normalizedPlan: "MONTHLY" | "YEARLY" = plan.includes("YEARLY") ? "YEARLY" : "MONTHLY";

    await connectDB();
    const shop = await ShopModel.findOne({ ownerId: result.clerkId });
    if (!shop) {
      return fail("NOT_FOUND", "Shop not found", 404);
    }

    if (!isStripeServerConfigured()) {
      if (isProduction()) {
        return fail("CONFIGURATION_ERROR", "Stripe is required for subscriptions in production.", 503);
      }

      const periodEnd = new Date();
      if (normalizedPlan === "MONTHLY") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      shop.subscription.plan = normalizedPlan;
      shop.subscription.status = "ACTIVE";
      shop.subscription.currentPeriodEnd = periodEnd;
      shop.subscription.trialEndsAt = undefined;
      await shop.save();

      return NextResponse.json({
        success: true,
        data: { sessionUrl: "/dashboard/billing?session_completed=true&mock=true" },
      });
    }

    if (isProduction()) {
      return fail("PAYMENT_UNAVAILABLE", "Stripe checkout is not fully implemented yet.", 503);
    }

    return NextResponse.json({
      success: true,
      data: { sessionUrl: "/dashboard/billing?session_completed=true" },
    });
  } catch (err) {
    return handleRouteError("shops/me/subscribe", err);
  }
}
