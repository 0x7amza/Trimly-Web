# Trimly Web Project Context For AI Agents

Use this file as a handoff prompt for another AI or developer. It summarizes the current codebase as implemented, not only the older planning docs.

## 1. Project Identity

Trimly is a multi-tenant barbershop/salon booking SaaS and public marketplace built as a Next.js App Router project.

The app has three major surfaces:

1. Public marketing and marketplace discovery.
2. B2B salon dashboard for owners and barbers.
3. B2C public booking pages at dynamic salon/category slugs.

The core business objects are shops, barbers, services, bookings, customers, products, and reviews.

## 2. Important Agent Instruction

The root `AGENTS.md` says this is not the Next.js version an AI may know from training. Before changing framework-specific code, read the relevant guide in `node_modules/next/dist/docs/`.

Installed versions:

- Next.js `16.2.6`
- React `19.2.4`
- TypeScript `5`
- Tailwind CSS `4`
- Clerk Next.js `7.3.7`
- Mongoose `9.6.2`
- Framer Motion `12.39.0`
- Stripe client libraries are installed. Booking payments, subscription checkout, and billing portal routes do not fake success; production webhook verification is guarded until the real implementation exists.

Next 16 patterns already present:

- Dynamic route params are typed as `Promise<{ ... }>` in pages, layouts, and route handlers.
- `src/proxy.ts` is used with `clerkMiddleware()`, not the older `middleware.ts` pattern.

## 3. Repo Layout

Top-level files:

- `package.json`: scripts and dependencies.
- `next.config.ts`: image remote patterns for Unsplash, Clerk images, Cloudinary.
- `tsconfig.json`: strict TypeScript, path alias `@/* -> ./src/*`, JSX `react-jsx`.
- `eslint.config.mjs`: Next core-web-vitals and TypeScript config.
- `.env.example`: includes app runtime, MongoDB, Clerk, B2C JWT, Stripe, Twilio, and upload notes.
- `backend-api.md`: older AI-friendly API documentation.
- `endpint.swagger.json`: OpenAPI 3.0 doc for core endpoints.
- `design.md`: Wise-inspired visual system used by the UI.
- `website-blueprint.md`: older architecture blueprint; some details are stale.
- `scratch_diff.txt`, `scratch_page_diff.txt`, `scratch_page_diff_utf8.txt`: large scratch diff artifacts.
- `public/uploads`: local uploaded images from the upload route.

Main source folders:

- `src/app`: App Router pages, layouts, and API route handlers.
- `src/components`: dashboard auth provider and small UI primitives.
- `src/lib`: API client, auth helpers, DB connection, models, utilities.
- `src/types`: TypeScript API DTO interfaces.

## 4. Scripts

From `package.json`:

- `npm run dev`: starts Next dev server.
- `npm run build`: builds production app.
- `npm run start`: starts built app.
- `npm run lint`: runs ESLint.

No test framework or test scripts are configured.

## 5. Environment Variables

Used by code:

- `MONGODB_URI`: required by `src/lib/db.ts`.
- `NEXT_PUBLIC_APP_URL`: used server-side by `src/lib/api.ts` when route handlers/pages call the internal API; defaults to `http://localhost:3000`.
- `NEXT_PUBLIC_BOOKING_BUFFER_MINUTES`: minimum online booking lead time before rounding to the next 15-minute slot; defaults to `15`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key.
- `CLERK_SECRET_KEY`: Clerk server key.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: present in example.
- `CUSTOMER_JWT_SECRET`: signs B2C customer JWTs. Production requires at least 32 characters; development has an explicit warning-only fallback.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: used by public booking page.
- `STRIPE_SECRET_KEY`: checked by payment/subscription routes; production Stripe behavior returns explicit 503s until real session/intent creation is implemented.
- `STRIPE_WEBHOOK_SECRET`: checked by webhook route; production requires it and still blocks until real Stripe `constructEvent` handling is implemented.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: used to send OTP SMS. If absent, dev sandbox returns/logs OTP.

## 6. Styling And Design System

The app uses Tailwind CSS v4 with CSS theme tokens in `src/app/globals.css`.

Design tone:

- Wise-inspired light palette: lime green primary `#9fe870`, sage canvas `#e8ebe6`, near-black ink `#0e0f0c`.
- Reusable CSS classes include `button-primary`, `button-secondary`, `button-tertiary`, `card-content`, `card-feature-sage`, `card-feature-green`, `card-feature-dark`, `text-input`, `badge-positive`, `badge-negative`.
- Many pages use rounded cards and bespoke Tailwind classes rather than a full component library.

Local UI primitives:

- `src/components/ui/card.tsx`: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter wrappers.
- `src/components/ui/custom-select.tsx`: animated dropdown select.
- `src/components/ui/custom-combobox.tsx`: searchable dropdown/combobox.
- `src/components/ui/PhoneInput.tsx`: country-code phone input; returns E.164-style values and validates national number length per country.

## 7. Data Models

Database is MongoDB via Mongoose. Connection is cached globally in `src/lib/db.ts`.

### Shop

File: `src/lib/models/Shop.ts`

Fields:

- `ownerId`: Clerk user id for owner.
- `name`, `slug`.
- `subscription`: `plan`, `status`, Stripe ids, period dates.
- `maxBarbersIncluded`: defaults to `5`.
- Images: `profileImage`, `profilePicture`, `images`, `galleryPictures`.
- Maps/location: `mapUrl`, `googleMapsUrl`, `country`, `state`, `city`, `address`.
- `timezone`: IANA timezone used to interpret opening hours and display appointment times; existing records without a value fall back to `UTC`.
- `businessHours`: array of `{ day, open, close, isClosed }`.

Shop slug is unique and indexed.

### Barber

File: `src/lib/models/Barber.ts`

Fields:

- `clerkId`: unique Clerk user id, indexed.
- `shopId`: ObjectId ref to Shop.
- `role`: `OWNER` or `BARBER`.
- `name`, `email`.
- Optional shop/profile fields: `shopName`, `slug`, `phone`, `address`, `bio`, `profileImage`, `images`, `city`, `businessHours`.

### Customer

File: `src/lib/models/Customer.ts`

Fields:

- `phone`: required, unique, indexed.
- `email`: sparse indexed.
- `name`: required by schema, but OTP upsert can create draft records before name is set.
- `passwordHash`, `otp`, `otpExpiresAt`.

### Service

File: `src/lib/models/Service.ts`

Fields:

- `barberId`: Clerk id of barber, indexed.
- `name`, `price`, `durationMinutes`.
- `isActive`: soft-delete flag.
- `category`, `categoryName`.

Prices are stored in pence/cents style integer minor units.

### Booking

File: `src/lib/models/Booking.ts`

Fields:

- `barberId`: Clerk id.
- `customerId`: optional ObjectId ref Customer.
- `serviceId`: ObjectId ref Service.
- `serviceSnapshot`: frozen service name, price, duration at booking time.
- `startTime`, `endTime`.
- `status`: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.
- `paymentStatus`: `PENDING`, `PAID`, `REFUNDED`.
- `paymentOption`: `ARRIVE` or `STRIPE`.
- `paymentIntentId`.
- `type`: `ONLINE` or `MANUAL`.
- `notes`, `customerName`, `customerPhone`.

Booking has an index on `{ barberId, startTime, endTime }`.

### Product

File: `src/lib/models/Product.ts`

Fields:

- `shopId`: ObjectId ref Shop, indexed.
- `name`, `description`, `price`, `imageUrl`, `isActive`.

### Review

File: `src/lib/models/Review.ts`

Fields:

- `shopId`: ObjectId ref Shop, indexed.
- `customerName`, `rating` from 1 to 5, optional `comment`.
- `createdAt`; no `updatedAt`.

## 8. Auth Architecture

Two auth systems exist:

### B2B Auth

Used for dashboard, owner/barber management, services, products, manual bookings, stats, upload, subscription routes.

- Clerk is global-wrapped in `src/app/layout.tsx` with `<ClerkProvider>`.
- `src/proxy.ts` uses `clerkMiddleware()`.
- API helpers in `src/lib/auth.ts`:
  - `requireClerkAuth()`: returns Clerk `userId` or 401 response.
  - `requireBarber()`: finds local Barber by Clerk id or 404.
  - `requireOwner()`: requires Barber role `OWNER` or 403.
- Client API attaches Clerk JWT by reading `window.Clerk.session.getToken()` when path looks like a B2B route.

### B2C Customer Auth

Used for public online bookings and customer booking history.

- `signCustomerToken(customerId)` signs 30-day HS256 JWT with `CUSTOMER_JWT_SECRET`.
- `verifyCustomerToken(request)` expects `Authorization: Bearer <token>`.
- Client stores token in `localStorage` as `trimly_auth_token`.
- Client stores customer JSON in `localStorage` as `trimly_customer`.

## 9. Client API Layer

File: `src/lib/api.ts`

The `api` object wraps route handlers under `/api/v1`.

Important details:

- On the server, it calls `${NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/v1${path}`.
- On the client, it calls `/api/v1${path}`.
- It always sets `Content-Type: application/json` except for `api.upload`.
- It tries Clerk token first for B2B paths, then falls back to customer JWT in localStorage.
- `mockDb` still exists as a no-op legacy stub.

API groups:

- `api.auth`: sendOtp, verifyOtp, register, login, logout, getCurrentCustomer.
- `api.barbers`: sync, getMe, updateMe.
- `api.services`: create, getBarberServices, update, delete.
- `api.bookings`: getAvailability, createOnline, createManual, getBarberBookings, getCustomerBookings, updateStatus.
- `api.shops`: create, getMe, updateMe, addBarber, getBySlug.
- `api.subscriptions`: subscribe, billingPortal.
- `api.config.getPublic`: reads safe public feature flags and the booking buffer.
- `api.statistics`: getShopStats, getBarberStats.
- `api.search`: public shop search.
- `api.products`: getShopProducts, create, update, delete.
- `api.upload`: multipart file upload.
- `api.reviews`: getBySlug, create.

## 10. API Route Handlers

All implemented under `src/app/api/v1`.

### Public Config

- `GET /api/v1/config/public`
  - Returns safe public flags: `stripeConfigured`, `onlinePaymentsEnabled`, `subscriptionBillingEnabled`, and `bookingBufferMinutes`.
  - Payment feature flags stay `false` until their real server flows are implemented, even if Stripe keys exist.

### Customer Auth

- `POST /api/v1/auth/customer/send-otp`
  - Body: `{ phone }`.
  - Requires E.164 regex `^\+[1-9]\d{6,14}$`.
  - Upserts Customer by phone with generated 6-digit OTP, expires in 10 minutes.
  - Uses Twilio if configured.
  - If Twilio env missing, logs OTP and returns `sandboxOtp` in non-production.

- `POST /api/v1/auth/customer/verify-otp`
  - Body: `{ phone, code }`.
  - Validates customer exists, OTP not expired, code matches.
  - Clears OTP, sets name to `"New Customer"` if needed.
  - Returns customer, token, `isNew`.

- `POST /api/v1/auth/customer/register`
  - Body: `{ phone, email?, password?, name }`.
  - Updates draft customer or creates new one.
  - Hashes optional password with bcrypt.
  - Returns customer and JWT.

- `POST /api/v1/auth/customer/login`
  - Body: `{ identifier, password }`.
  - Identifier can be email or phone.
  - Requires `passwordHash`.

### Barbers

- `POST /api/v1/barbers/sync`
  - Clerk auth required.
  - Body: `{ name, email, shopId? }`.
  - Creates or updates local Barber.
  - If a pending barber record exists by email, claims it with real Clerk id.
  - Drops old `slug_1` index if present every call.

- `GET /api/v1/barbers/me`
  - Clerk/local barber required.
  - Returns current barber.

- `PUT /api/v1/barbers/me`
  - Clerk/local barber required.
  - Allows updates to shopName, phone, address, bio, businessHours, city, profileImage, images.

### Services

- `POST /api/v1/services`
  - Barber required.
  - Creates service for current Clerk id.

- `GET /api/v1/services/barber/[clerkId]`
  - Public.
  - Returns active services for a barber.

- `PUT /api/v1/services/[id]`
  - Barber required.
  - Only service owner can update.

- `DELETE /api/v1/services/[id]`
  - Barber required.
  - Soft deletes by setting `isActive = false`.

### Bookings

- `GET /api/v1/bookings/barber/[clerkId]/availability?serviceId=&date=YYYY-MM-DD`
  - Public.
  - Finds barber, service duration, and business hours.
  - Reads business hours from Shop first, then Barber, then default `09:00-18:00`.
  - Interprets the selected date and hours in `Shop.timezone`.
  - For today, removes slots earlier than the rounded `now + booking buffer`.
  - Returns available ISO slot starts in 15-minute increments.
  - Filters out overlapping non-cancelled bookings.

- `POST /api/v1/bookings/online`
  - Customer JWT required.
  - Body: `{ barberId, serviceId, startTime, paymentOption?, notes? }`.
  - Validates service id, ISO start time, payment option, and service ownership by selected barber.
  - Checks service exists, start time is not in the past/booking buffer, appointment stays inside opening hours, and slot has no overlapping booking.
  - Uses a short Mongo-backed per-barber lock before the final overlap check and insert.
  - Creates `ONLINE` booking with customer name/phone snapshot.
  - Pay-on-arrival creates the booking and returns `clientSecret: null`.
  - Stripe/card payment currently returns a 503 `PAYMENT_UNAVAILABLE` response until real PaymentIntent creation is implemented.

- `POST /api/v1/bookings/manual`
  - Barber required.
  - Body: `{ serviceId, startTime, customerName?, customerPhone?, notes?, durationMinutes? }`.
  - Supports blocked time when notes start with `[BLOCKED]`.
  - Checks overlaps for current barber.
  - Creates `MANUAL` booking.

- `GET /api/v1/bookings/me/barber`
  - Barber required.
  - Returns all non-cancelled bookings for current barber.

- `GET /api/v1/bookings/me/customer`
  - Customer JWT required.
  - Returns bookings for current customer.

- `PATCH /api/v1/bookings/[id]/status`
  - Barber required.
  - Current barber must own booking.
  - Updates status to valid enum.

### Shops And Subscriptions

- `POST /api/v1/shops`
  - Clerk auth required.
  - Body: `{ name, country, state }`.
  - One shop per owner.
  - Creates slug from name and avoids reserved slugs.
  - Starts 14-day trial: `subscription.status = TRIALING`, `plan = NONE`.
  - Updates current barber to OWNER with `shopId`, slug, shopName.

- `GET /api/v1/shops/me`
  - Barber required.
  - Finds shop by owner id or current barber `shopId`.
  - Returns shop and all barbers in shop.

- `PUT /api/v1/shops/me`
  - Owner required.
  - Allows name, images, map URLs, country/state/city/address, businessHours.
  - Resolves Google Maps short URLs by following redirects.
  - Syncs mapUrl/googleMapsUrl, profileImage/profilePicture, images/galleryPictures.
  - If `state` updates, city is set to state.

- `POST /api/v1/shops/me/barbers`
  - Owner required.
  - Body: `{ barberEmail, barberName? }`.
  - Creates placeholder Barber with `clerkId: pending_<timestamp>` if barber has not signed up.
  - Existing barbers can be linked if not already tied to another shop.

- `GET /api/v1/shops/[slug]`
  - Public.
  - Returns shop and barbers by shop slug.

- `POST /api/v1/shops/me/subscribe`
  - Owner required.
  - Validates supported plan strings.
  - Returns an explicit 503 JSON error until real Stripe Checkout Session creation is implemented.
  - Never activates a subscription without verified payment.

- `POST /api/v1/shops/me/billing-portal`
  - Owner required.
  - Returns an explicit 503 JSON error until real Stripe billing portal session creation is implemented.
  - Never returns a fake or generic portal URL.

### Products

- `GET /api/v1/products`
  - Public fallback route.
  - Optional `shopId` query; without it returns active products.

- `POST /api/v1/products`
  - Barber required.
  - Creates product for current barber's shop.
  - Accepts JSON or multipart form data.

- `GET /api/v1/shops/[slug]/products`
  - Public.
  - `slug` can be actual slug or ObjectId.
  - Returns all products for shop.

- `POST /api/v1/shops/[slug]/products`
  - Barber required.
  - Validates slug/ObjectId, verifies the authenticated barber belongs to the target shop, then creates the product.
  - Accepts JSON or multipart form data.

- `PUT /api/v1/shops/[slug]/products/[id]`
  - Barber required.
  - Verifies barber belongs to shop.
  - Updates product.

- `DELETE /api/v1/shops/[slug]/products/[id]`
  - Barber required.
  - Verifies barber belongs to shop.
  - Hard deletes product.

### Reviews

- `GET /api/v1/shops/[slug]/reviews`
  - Public.
  - Returns reviews newest first.

- `POST /api/v1/shops/[slug]/reviews`
  - Public.
  - Body: `{ customerName, rating, comment? }`.
  - Validates/sanitizes input and rate limits writes.
  - No auth or verified-booking check yet.

### Search

- `GET /api/v1/search?city=&country=&state=&searchQuery=&page=&limit=`
  - Public.
  - Searches shops by escaped/capped regex filters.
  - Returns results with calculated average rating and review count.
  - Also returns distinct active cities.

### Upload

- `POST /api/v1/upload`
  - Clerk auth required.
  - Multipart form field `file`.
  - Allows JPEG, PNG, WebP, GIF up to 5 MB.
  - Validates MIME type and image file signatures.
  - Rate limits writes.
  - Writes to `public/uploads/<uuid>.<ext>`.
  - Returns URL `/uploads/<filename>`.
  - This is local filesystem storage and is not durable on serverless/Vercel unless changed.

### Payments

- `POST /api/v1/payments/webhook`
  - Public webhook route.
  - If `STRIPE_WEBHOOK_SECRET` is missing in development, skips verification and returns `{ received: true, mode: "development-unverified" }`.
  - In production, missing webhook secret or unfinished verification returns explicit 503 JSON errors.
  - Real Stripe `constructEvent` and event handling are TODO.

### Statistics

- `GET /api/v1/statistics/shop`
  - Owner required.
  - Counts all bookings across shop barbers.

- `GET /api/v1/statistics/barber/[barberId]`
  - Barber required.
  - Owners can pass any barber id; barbers are forced to their own id.

## 11. App Routes And UI Flows

### Root Layout

File: `src/app/layout.tsx`

- Sets metadata.
- Wraps all children in ClerkProvider.
- Applies global CSS and default canvas/ink body colors.

### Marketing Group

Files under `src/app/(marketing)`.

- `layout.tsx`: sticky top nav and footer. Shows dashboard link when signed in, otherwise "For Professionals".
- `page.tsx`: main landing page.
  - Hero for public booking marketplace.
  - Loads first real shop for live hero preview; falls back to register prompt.
  - Search bar with city combobox and shop suggestions.
  - Search submits to `/barber?city=...`.
  - Feature cards for walk-in calendar, WhatsApp confirmations, custom booking link.
  - Pricing section with Growth and Pro cards.
  - Pricing CTA sends signed-in users to `/dashboard/billing?plan=...`, otherwise `/for-professionals`.
- `for-professionals/page.tsx`: Clerk sign-in/sign-up chooser. Reads `shopId` query param and stores it in localStorage as `inviteShopId` for staff invite linking.
- `discover/page.tsx`: separate directory page using `/api/v1/search`; not the same as `/barber`.
- `tarifs/page.tsx`: redirects to `/#pricing`.

### Dynamic Public Category Or Salon Route

Files under `src/app/[salonSlug]`.

- `layout.tsx`
  - Blocks reserved slugs like dashboard, billing, pricing, api, login, admin, settings, register, auth.
  - Allows category slugs: `hairdresser`, `barber`, `manicure`, `beauty-salon`.
  - For non-category slugs, verifies shop exists by calling `api.shops.getBySlug`.

- `page.tsx`
  - If slug is a category, renders `CategoryLandingView`.
  - Otherwise fetches shop server-side and renders `SalonBookingPage`.

- `CategoryLandingView.tsx`
  - Category directory UI for hairdresser/barber/manicure/beauty-salon.
  - Currently all shops are effectively treated as `barber` because `getCategorySlugForShop()` returns `"barber"` unconditionally.
  - Uses `/api/v1/search` and active cities.
  - Reads the `city` query string, so marketing search handoff to `/barber?city=...` preselects the location.

- `SalonBookingPage.tsx`
  - Full public storefront and booking flow.
  - Shows salon headline, reviews, dynamic gallery, service menu grouped by category, products marketplace/cart, map, opening hours, specialists.
  - Loads reviews by slug.
  - Loads all active services for all shop barbers.
  - De-duplicates services by service name across barbers.
  - Loads active products for the shop.
  - Booking modal flow:
    - Service is selected before modal.
    - Step 1: choose barber if multiple barbers.
    - Step 3: choose date/time from next 14 days.
    - Step 4: phone OTP and optional new customer profile completion.
    - Step 5: checkout with payment option `STRIPE` or `ARRIVE`.
    - Step 6: success.
  - Uses Framer Motion for modal transitions.
  - Only shows the Stripe/CardElement payment option when a non-mock `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists.
  - Server still blocks `STRIPE` booking payment until real PaymentIntent creation is implemented, so pay-on-arrival is the safe path.
  - Product cart appears in UI/order summary and is persisted into booking `notes` as a summary. A proper order/line-item schema is still needed.
  - Map uses Google embed URL when available; otherwise an iframe with Leaflet/OpenStreetMap and Nominatim lookup.

### Dashboard Group

Files under `src/app/(dashboard)`.

- `layout.tsx`
  - Client layout with Clerk sign-in handling.
  - Wraps children in `B2BProviders`.
  - Shows full sidebar/topbar when signed in.
  - If no shop:
    - Owner sees onboarding form to create shop.
    - Barber sees pending-invitation screen.
  - Subscription guard:
    - `ACTIVE` and `TRIALING` allow dashboard access.
    - Other statuses lock dashboard except billing.
  - Nav items:
    - Calendar, Services, Products, Analytics for owner/barber.
    - Staff, Billing, Settings for owner.
  - Back to Home link always visible.

- `dashboard/page.tsx`
  - Client redirect to `/dashboard/calendar`.

- `dashboard/calendar/page.tsx`
  - Daily timeline UI.
  - Loads current barber bookings and services.
  - Filters bookings using a timezone-aware UTC day range rather than an ISO string prefix.
  - Timeline uses `Shop.businessHours` for the selected date, with a 09:00-18:00 fallback when no hours are saved.
  - Closed days show a closed-state message.
  - Displays and creates appointments in `Shop.timezone`; empty past slots are not clickable.
  - Empty slots open quick-add modal.
  - Supports walk-in manual bookings and blocked time.
  - Existing booking opens details modal with cancel/complete actions.

- `dashboard/services/page.tsx`
  - Current barber's service menu.
  - Create, edit, soft-delete services.
  - Groups services by `category`.
  - Price UI uses major currency units and converts to integer minor units.

- `dashboard/products/page.tsx`
  - Shop product marketplace manager.
  - Load products for current shop.
  - Create, edit, delete products.
  - Upload product images through `/api/v1/upload` after client-side compression.
  - Uses fallback Unsplash image if none.

- `dashboard/settings/page.tsx`
  - Owner-only.
  - Edit shop name, country/state, address/map URL, opening hours, profile/cover image, gallery images.
  - Upload profile/gallery images through `/api/v1/upload` after compression.
  - Saves to `/api/v1/shops/me`.

- `dashboard/staff/page.tsx`
  - Owner-only.
  - Shows invite link `/for-professionals?shopId=<shop.id>`.
  - Lists current barbers.
  - UI no longer directly calls `api.shops.addBarber`, though API still exists.

- `dashboard/billing/page.tsx`
  - Owner-only.
  - Shows current subscription, trial, active plan, seat usage.
  - Shows an unavailable state and disables billing actions when Stripe is not configured.
  - Only follows real Stripe Checkout or Billing Portal URLs returned by the server.

- `dashboard/analytics/page.tsx`
  - Owner sees shop stats; barber sees personal stats.
  - Revenue is estimated as completed bookings times 25.00.
  - Chart is static/custom SVG; Recharts is installed but not used here.

## 12. B2B Provider Flow

File: `src/components/providers.tsx`

`B2BProviders`:

1. Waits for Clerk user.
2. Reads `inviteShopId` from localStorage if present.
3. Calls `api.barbers.sync({ name, email, shopId: inviteShopId })`.
4. Stores active barber and role.
5. Removes `inviteShopId`.
6. Calls `api.shops.getMe()` to get shop and all barbers.
7. Exposes `activeBarber`, `shop`, `allBarbers`, `role`, `isLoading`, `refreshShopData()`.

This is the main dashboard state source. There is no Zustand store despite older blueprint notes.

## 13. Utility Files

- `src/lib/utils.ts`
  - `cn()` combines clsx and tailwind-merge.
  - `getEmbeddableMapUrl()` turns Google Maps links, iframe snippets, coordinates, or plain addresses into embeddable map URLs when possible.

- `src/lib/api-response.ts`
  - Server-only helpers for consistent JSON API success and structured error responses.

- `src/lib/api-error.ts`
  - Client-safe helper for extracting error messages from both legacy string errors and newer structured errors.

- `src/lib/env.ts`
  - Production-aware config helpers for app URL, customer JWT secret, and Stripe readiness.

- `src/lib/rate-limit.ts`
  - In-memory route rate limiter used by auth, bookings, reviews, and upload routes. It is useful for single-instance/development but should be replaced with Redis/Upstash/etc. for multi-instance production.

- `src/lib/validation.ts`
  - Shared validators and sanitizers for ObjectIds, slugs, E.164 phone numbers, ISO dates, pagination, prices, and short strings.

- `src/lib/booking-time.ts`
  - Shared timezone-aware business-hours, booking-buffer, slot-generation, and booking-time validation logic.

- `src/lib/booking-lock.ts`
  - Serializes booking creation per barber across app instances before the final overlap check.

- `src/lib/image-utils.ts`
  - Client-side image compression using canvas.
  - Skips non-images and GIFs.
  - Defaults to max 1024x1024 and quality 0.75.

- `src/lib/locations.ts`
  - Country/state lists for Iraq, France, UK, US.
  - Used in shop onboarding and settings.

- `src/lib/uk-cities.ts`
  - UK city list and options. Currently less central than `locations.ts`.

## 14. Docs And Drift Notes

Docs exist but are partly stale:

- `backend-api.md` and `endpint.swagger.json` document the original API well, but do not fully cover implemented products/reviews/upload behavior.
- `website-blueprint.md` says Next.js 14+, Zustand, Shadcn, dark Vercel/Linear style. Actual app is Next 16, no Zustand, no full Shadcn, light Wise-style design.
- `design.md` is more aligned with the current CSS: Wise-inspired green/sage/ink palette.

## 15. Known Gaps And Watch-Outs

These are important for future work:

- Real Stripe is incomplete:
  - Online booking card payments are blocked with 503 until PaymentIntent creation is implemented.
  - Subscription checkout has TODO code when Stripe secret exists and is blocked in production.
  - Billing portal session creation is TODO and is blocked in production.
  - Webhook verification/handling is TODO and is blocked in production.
- `.env.example` now includes the key runtime variables, but production secrets/URLs still need real values.
- Customer JWT uses a development-only fallback if env is missing outside production; production requires a strong `CUSTOMER_JWT_SECRET`.
- Uploads write to `public/uploads`; this is not durable cloud storage.
- Public reviews are unauthenticated and not tied to completed bookings.
- Public product cart is only persisted into booking `notes`, not as normalized product line items.
- Bookings are stored as UTC timestamps and the public booking/dashboard calendar use `Shop.timezone`. Existing shops must confirm their timezone in Settings because missing values fall back to `UTC`.
- Category pages other than `/barber` currently show no shops because category matching is hardcoded to `"barber"`.
- `barbers/sync` attempts to drop the old `slug_1` index on every sync call.
- Some older comments/docs mention WhatsApp automation, but implemented OTP is SMS via Twilio Messages API and booking confirmations are not fully implemented.

## 16. Good Mental Model For Changes

When adding features, think in these boundaries:

- Public marketplace and booking page should use public GET routes for shops, services, products, reviews, search, availability.
- Customer actions that create online bookings require customer JWT from OTP flow.
- Dashboard actions use Clerk auth and local Barber records.
- Owner-only actions should go through `requireOwner()`.
- Barber-scoped actions should use Clerk id as `barberId`.
- Shop-scoped actions should use `shopId` ObjectIds and check membership/ownership.
- For availability, update or read `Shop.businessHours` first because settings saves hours there.
- Keep prices as integer minor units in API/database and convert only at UI edges.

## 17. Verification Note

No automated test suite is configured.

Current verification:

- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes.
- Scoped ESLint for the hardened server/API files passes.
- Full `npm run lint` passes with 61 warning-only findings, mainly existing `<img>` optimization and hook dependency cleanup.
