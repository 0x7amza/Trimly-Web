import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";
import { fail } from "@/lib/api-response";
import { isProduction, isStripeServerConfigured } from "@/lib/env";

// POST /api/v1/shops/me/billing-portal
export async function POST() {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  if (!isStripeServerConfigured()) {
    if (isProduction()) {
      return fail("CONFIGURATION_ERROR", "Stripe is required for the billing portal in production.", 503);
    }

    return NextResponse.json({
      success: true,
      data: { portalUrl: "/dashboard/billing?mock_portal=true" },
    });
  }

  if (isProduction()) {
    return fail("PAYMENT_UNAVAILABLE", "Stripe billing portal is not fully implemented yet.", 503);
  }

  return NextResponse.json({
    success: true,
    data: { portalUrl: "/dashboard/billing?stripe_portal_todo=true" },
  });
}
