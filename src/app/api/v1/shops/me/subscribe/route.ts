import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth";
import { fail, handleRouteError } from "@/lib/api-response";

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

    return fail(
      "PAYMENT_UNAVAILABLE",
      "Subscription checkout is not enabled yet. No subscription changes were made.",
      503
    );
  } catch (err) {
    return handleRouteError("shops/me/subscribe", err);
  }
}
