import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ShopModel } from "@/lib/models/Shop";
import { requireOwner } from "@/lib/auth";

// POST /api/v1/shops/me/subscribe
export async function POST(request: NextRequest) {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  try {
    const { plan } = await request.json();
    if (!["MONTHLY", "YEARLY"].includes(plan)) {
      return NextResponse.json({ success: false, error: "Plan must be MONTHLY or YEARLY" }, { status: 400 });
    }

    await connectDB();
    const shop = await ShopModel.findOne({ ownerId: result.clerkId });
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    // Stripe integration placeholder
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      // No Stripe configured — return mock session for development
      return NextResponse.json({
        success: true,
        data: { sessionUrl: "/dashboard/billing?session_completed=true&mock=true" },
      });
    }

    // When Stripe is configured, create a real checkout session here
    // const stripe = new Stripe(stripeSecretKey);
    // const session = await stripe.checkout.sessions.create({ ... });
    return NextResponse.json({
      success: true,
      data: { sessionUrl: "/dashboard/billing?session_completed=true" },
    });
  } catch (err) {
    console.error("[shops/me/subscribe]", err);
    return NextResponse.json({ success: false, error: "Failed to start checkout" }, { status: 500 });
  }
}
