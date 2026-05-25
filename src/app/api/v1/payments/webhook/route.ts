import { NextRequest, NextResponse } from "next/server";

// POST /api/v1/payments/webhook
// Stripe sends raw body with stripe-signature header
export async function POST(request: NextRequest) {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeWebhookSecret) {
    console.log("[webhook] STRIPE_WEBHOOK_SECRET not configured — skipping verification");
    return NextResponse.json({ received: true });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ success: false, error: "Missing stripe-signature" }, { status: 400 });
  }

  try {
    // When Stripe is configured:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    // handle event.type === 'invoice.paid', 'customer.subscription.deleted', etc.

    const event = JSON.parse(body);
    console.log("[webhook] Received event type:", event.type);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 400 });
  }
}
