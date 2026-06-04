import { NextRequest, NextResponse } from "next/server";
import { fail, handleRouteError } from "@/lib/api-response";
import { isProduction } from "@/lib/env";

// POST /api/v1/payments/webhook
// Stripe sends raw body with stripe-signature header.
export async function POST(request: NextRequest) {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeWebhookSecret) {
    if (isProduction()) {
      return fail("CONFIGURATION_ERROR", "Stripe webhook secret is required in production.", 503);
    }

    console.log("[webhook] STRIPE_WEBHOOK_SECRET not configured; development webhook verification skipped");
    return NextResponse.json({ received: true, mode: "development-unverified" });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return fail("BAD_REQUEST", "Missing stripe-signature", 400);
  }

  try {
    if (isProduction()) {
      return fail("PAYMENT_UNAVAILABLE", "Stripe webhook event verification is not fully implemented yet.", 503);
    }

    // Development placeholder until the Stripe SDK-backed constructEvent call is wired.
    const event = JSON.parse(body);
    console.log("[webhook] Received development event type:", event.type);

    return NextResponse.json({ received: true });
  } catch (err) {
    return handleRouteError("payments/webhook", err);
  }
}
