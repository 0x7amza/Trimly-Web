import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";

// POST /api/v1/shops/me/billing-portal
export async function POST() {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({
      success: true,
      data: { portalUrl: "https://billing.stripe.com" },
    });
  }

  // When Stripe is configured:
  // const stripe = new Stripe(stripeSecretKey);
  // const session = await stripe.billingPortal.sessions.create({ customer: shop.subscription.stripeCustomerId, ... });
  return NextResponse.json({
    success: true,
    data: { portalUrl: "https://billing.stripe.com" },
  });
}
