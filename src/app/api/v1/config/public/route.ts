import { ok } from "@/lib/api-response";
import { getBookingBufferMinutes } from "@/lib/booking-time";
import { isStripeConfigured } from "@/lib/env";

// GET /api/v1/config/public
export async function GET() {
  const stripeOk = isStripeConfigured();
  return ok({
    stripeConfigured: stripeOk,
    onlinePaymentsEnabled: stripeOk,
    subscriptionBillingEnabled: stripeOk,
    bookingBufferMinutes: getBookingBufferMinutes(),
  });
}
