# Trimly Production Audit And Hardening Log

Date: 2026-06-04

This audit records the current production-readiness state of Trimly and the hardening changes made in this pass. It is intentionally honest: several Stripe and storage items remain blocked until provider decisions/credentials exist.

## Executive Summary

Trimly is a strong early SaaS implementation with clear B2B/B2C boundaries, but it had launch-blocking risks around mock payments, missing production env guards, weak validation, local uploads, unauthenticated public writes, product RBAC, and calendar/business-hour drift.

This pass implemented the highest-risk fixes first:

- Added shared JSON error/response helpers.
- Removed insecure customer JWT fallback behavior in production.
- Added rate limiting for OTP, auth, booking, upload, and review writes.
- Hardened OTP, login, registration, booking, availability, reviews, search, and upload input handling.
- Blocked fake Stripe card payments/subscription/billing/webhook behavior in production.
- Hid public card checkout when Stripe is not configured.
- Fixed product creation membership checks for `/shops/[slug]/products`.
- Persisted product-cart notes into online booking creation.
- Aligned dashboard calendar slots with `Shop.businessHours`.
- Added `/api/v1/health`.
- Updated `.env.example` with missing production variables.
- Added baseline security headers in `next.config.ts`.

## 1. Critical Security Issues

### Customer JWT fallback secret

- File: `src/lib/auth.ts`
- Risk: Critical
- Problem: Customer JWTs used a hardcoded fallback secret when `CUSTOMER_JWT_SECRET` was missing.
- Why it matters: Production customer tokens could be forged if the fallback secret is known.
- Fix strategy: Require a strong secret in production and keep a development-only fallback with warnings.
- Status: Fixed via `src/lib/env.ts` and `src/lib/auth.ts`.

### Mock payment activation in production

- Files:
  - `src/app/api/v1/bookings/online/route.ts`
  - `src/app/api/v1/shops/me/subscribe/route.ts`
  - `src/app/api/v1/shops/me/billing-portal/route.ts`
  - `src/app/api/v1/payments/webhook/route.ts`
- Risk: Critical
- Problem: Stripe-related routes could pretend work was complete or skip verification.
- Why it matters: Users could be marked subscribed/booked/paid without real payment verification.
- Fix strategy: Development mock mode only; production returns explicit JSON errors until real Stripe code is added.
- Status: Partially fixed; real Stripe integration remains deferred.

### Product shop membership bypass

- File: `src/app/api/v1/shops/[slug]/products/route.ts`
- Risk: High
- Problem: Authenticated barbers could create products under a shop id/slug they did not belong to.
- Why it matters: Cross-tenant data mutation vulnerability.
- Fix strategy: Verify `result.barber.shopId` matches target shop before product create.
- Status: Fixed.

## 2. Auth And RBAC Issues

### Inconsistent server-side membership checks

- Files: Product, service, booking, shop routes.
- Risk: High
- Problem: Several routes were protected by Clerk but did not consistently validate resource ownership/membership.
- Why it matters: Tenant isolation is core to a B2B SaaS.
- Fix strategy: Add membership checks to high-risk product and booking flows first; continue audit for all routes.
- Status: Partially fixed.

### Public reviews are unauthenticated

- File: `src/app/api/v1/shops/[slug]/reviews/route.ts`
- Risk: Medium
- Problem: Anyone can post reviews.
- Why it matters: Spam and fake reviews can damage marketplace trust.
- Fix strategy: Added validation/rate limiting now; later tie reviews to verified completed bookings.
- Status: Partially fixed.

## 3. Booking And Scheduling Issues

### Fake/unfinished card payment path

- Files:
  - `src/app/[salonSlug]/SalonBookingPage.tsx`
  - `src/app/api/v1/bookings/online/route.ts`
- Risk: Critical
- Problem: UI showed Stripe deposit even when backend returned `clientSecret: null`.
- Why it matters: Customers could believe they paid when they did not.
- Fix strategy: Hide Stripe option without public key; server rejects Stripe until real backend implementation exists.
- Status: Fixed as a safety guard; real card payment remains deferred.

### Dashboard calendar ignored shop hours

- File: `src/app/(dashboard)/dashboard/calendar/page.tsx`
- Risk: Medium
- Problem: Dashboard calendar was hardcoded to 09:00-18:00 while public availability used `Shop.businessHours`.
- Why it matters: Staff could see/manage slots outside or inside a different schedule than customers.
- Fix strategy: Generate dashboard slots from `shop.businessHours`.
- Status: Fixed.

### Race-condition-safe double booking

- Files: Booking model/routes.
- Risk: High
- Problem: Conflict checks happen before insert but no database-level lock/transaction exists.
- Why it matters: Two concurrent requests can still race.
- Fix strategy: Add stricter server validation now; next step is Mongo transaction or slot-lock strategy.
- Status: Not fully fixed.

## 4. Payment/Stripe Readiness Issues

- Risk: Critical
- Current state: Stripe is guarded but not production-implemented.
- Fixed:
  - No production mock subscription activation.
  - No production fake billing portal URL.
  - No production webhook verification skipping.
  - No online customer card checkout without real backend support.
- Deferred:
  - PaymentIntent creation for bookings.
  - Checkout Session creation for subscriptions.
  - Billing portal session creation.
  - Webhook `constructEvent` verification and event handlers.

## 5. API Contract Issues

### Inconsistent error shape

- Files: Many route handlers.
- Risk: Medium
- Problem: Existing routes return a mix of string errors and object errors.
- Why it matters: Clients need predictable errors and should never receive HTML errors.
- Fix strategy: Added `src/lib/api-response.ts`; updated high-risk routes; API client now understands both legacy and new shapes.
- Status: Partially fixed.

### Swagger/doc drift

- Files: `endpint.swagger.json`, `backend-api.md`, implemented route handlers.
- Risk: Medium
- Problem: Implemented products/reviews/upload/health and payment guards differ from docs.
- Why it matters: Agents and clients can call wrong contracts.
- Fix strategy: Document drift in this audit; update OpenAPI in a later dedicated pass.
- Status: Not fully fixed.

## 6. Database/Model Issues

### Missing indexes

- Files: Mongoose models.
- Risk: Medium
- Problem: Some high-traffic query patterns lack compound indexes.
- Fix strategy: Add indexes for search, products, reviews, service availability, customer auth in a model migration pass.
- Status: Not fixed in this pass.

### Product cart not persisted

- Files:
  - `src/app/[salonSlug]/SalonBookingPage.tsx`
  - `src/app/api/v1/bookings/online/route.ts`
- Risk: Medium
- Problem: Public UI showed product cart but booking route ignored it.
- Fix strategy: Persist product summary in booking notes for now; future proper fix is an order/line-item schema.
- Status: Partially fixed.

## 7. Frontend UX Issues

### Stripe unavailable state

- File: `src/app/[salonSlug]/SalonBookingPage.tsx`
- Risk: High
- Problem: UI advertised card payment without real configuration.
- Fix strategy: Hide card option unless public Stripe key exists; server still blocks until backend is real.
- Status: Fixed.

### Homepage search city handoff

- File: `src/app/[salonSlug]/CategoryLandingView.tsx`
- Risk: Low
- Problem: Homepage pushed `/barber?city=...`, but category page ignored it.
- Fix strategy: Read `city` with `useSearchParams`.
- Status: Fixed.

## 8. Performance Issues

- Public booking pages make multiple client-side calls for services/products/reviews.
- Search uses regex matching; input is now escaped and capped, but larger datasets need text indexes.
- Uploads are local filesystem and unsuitable for serverless durability.
- Recharts is installed but dashboard analytics uses static SVG.

Status: Not fully fixed.

## 9. Error Handling Issues

- Added `src/lib/api-response.ts` for consistent JSON helpers.
- Added API client compatibility for both string and object errors.
- High-risk routes now use generic internal errors.

Status: Partially fixed.

## 10. Environment/Configuration Issues

- File: `.env.example`
- Risk: High
- Problem: Missing `MONGODB_URI`, `NEXT_PUBLIC_APP_URL`, `CUSTOMER_JWT_SECRET`, `STRIPE_WEBHOOK_SECRET`, upload note.
- Fix strategy: Updated `.env.example`.
- Status: Fixed.

## 11. Production Deployment Issues

- Local `public/uploads` is not durable on Vercel/serverless.
- Stripe remains deferred.
- No monitoring/logging provider is configured.
- Added `/api/v1/health`.
- Added baseline security headers.

Status: Partially fixed.

## 12. Missing Tests And Verification Issues

- No automated tests exist.
- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes.
- Scoped ESLint for the hardened server/API files passes.
- Full `npm run lint` still fails with 50 errors and 68 warnings on existing client/page lint debt, including React `set-state-in-effect` findings and older `any` usage outside the hardened API set.
- Suggested test foundation:
  - Unit tests for validation helpers.
  - Unit tests for map URL normalization.
  - Unit tests for booking overlap logic.
  - API tests for OTP, online booking, product RBAC, upload rejection.
  - E2E smoke tests for owner onboarding, service CRUD, public booking pay-on-arrival.

Status: Partially verified; automated tests and repo-wide lint cleanup remain.

## Stripe-Deferred Checklist

When Stripe keys are available:

- Add real `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Create Stripe products/prices for MONTHLY/YEARLY plans.
- Implement subscription Checkout Session creation.
- Implement billing portal sessions tied to `shop.subscription.stripeCustomerId`.
- Implement booking PaymentIntent creation for online deposit/full payment.
- Return real `clientSecret`.
- Use Stripe webhook `constructEvent`.
- Handle `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`, `payment_intent.succeeded`, and payment failures.
- Update `paymentStatus` and `subscription` state from verified webhook events only.
- Run Stripe test cards and webhook CLI tests before production.
