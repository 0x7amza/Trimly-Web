# Trimly Web

Trimly is a multi-tenant barbershop/salon booking SaaS and public marketplace built with Next.js App Router, Clerk, Mongoose, Tailwind CSS, and Stripe client libraries.

For a full AI/developer handoff, read:

- `PROJECT_CONTEXT_FOR_AI.md` for architecture, flows, models, routes, and current mental model.
- `PRODUCTION_AUDIT_AND_HARDENING.md` for production risks, fixes made, and remaining launch blockers.
- `AGENTS.md` before framework-specific code changes.

## Important Next.js Note

This project uses Next.js `16.2.6`. Before changing Next-specific APIs, route handlers, proxy/middleware, headers, or App Router behavior, read the relevant guide in `node_modules/next/dist/docs/`.

## Stack

- Next.js `16.2.6`
- React `19.2.4`
- TypeScript `5`
- Tailwind CSS `4`
- Clerk for B2B dashboard auth
- Custom JWT/OTP customer auth for public bookings
- MongoDB with Mongoose
- Stripe packages installed, but production Stripe checkout/payment/webhook logic is intentionally guarded until fully implemented

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Minimum local variables:

- `MONGODB_URI`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CUSTOMER_JWT_SECRET`

Optional booking configuration:

- `NEXT_PUBLIC_BOOKING_BUFFER_MINUTES=15`

Twilio is optional locally. If Twilio credentials are missing, OTP routes use a development sandbox response.

Stripe is optional locally. Card payments, subscription checkout, and billing portal sessions are disabled until the real Stripe server implementation is completed. Production webhook verification is also blocked until it is implemented.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Current verification status:

- `npx tsc --noEmit --pretty false`: passes.
- `npm run build`: passes.
- Scoped lint for the hardened server/API files: passes.
- Full `npm run lint`: passes with 61 warning-only findings, mainly existing `<img>` optimization and hook dependency cleanup.

## Production Checklist

- Set strong production secrets, especially `CUSTOMER_JWT_SECRET`.
- Use durable upload storage instead of `public/uploads`.
- Implement real Stripe PaymentIntent, Checkout Session, Billing Portal, and webhook `constructEvent` flows before enabling card payments/subscriptions.
- Open dashboard Settings and confirm the correct IANA salon timezone, especially for shops created before timezone support was added.
- Tie reviews to verified completed bookings or add stronger abuse controls.
- Update OpenAPI/docs after API contract cleanup is finished.
- Add automated tests for auth, booking, product RBAC, uploads, payments, and search.
