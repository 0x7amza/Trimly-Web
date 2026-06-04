import { requireOwner } from "@/lib/auth";
import { fail } from "@/lib/api-response";

// POST /api/v1/shops/me/billing-portal
export async function POST() {
  const result = await requireOwner();
  if ("error" in result) return result.error;

  return fail(
    "PAYMENT_UNAVAILABLE",
    "The billing portal is not enabled yet. No billing changes were made.",
    503
  );
}
