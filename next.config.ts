import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Verify Clerk env vars at startup — fail loudly rather than silently
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[Trimly] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. " +
        "Authentication cannot start. Add it to .env.local or your deployment environment."
    );
  } else {
    console.warn(
      "\n⚠️  [Trimly] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing from .env.local.\n" +
        "   Clerk JS will fail to load. Copy .env.example → .env.local and fill in your keys.\n"
    );
  }
}
if (!process.env.CLERK_SECRET_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[Trimly] CLERK_SECRET_KEY is not set. " +
        "Server-side authentication will not work. Add it to your deployment environment."
    );
  } else {
    console.warn(
      "\n⚠️  [Trimly] CLERK_SECRET_KEY is missing from .env.local.\n" +
        "   Server-side Clerk calls will fail.\n"
    );
  }
}

// Log only existence — never the values
if (isDev) {
  console.info(
    `[Trimly] Clerk env check — NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists: ${Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)}`
  );
  console.info(
    `[Trimly] Clerk env check — CLERK_SECRET_KEY exists: ${Boolean(process.env.CLERK_SECRET_KEY)}`
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Content-Security-Policy
//
// Clerk loads its JS from the Clerk Accounts CDN (*.clerk.accounts.dev) and
// communicates with Clerk APIs.  The following domains MUST be present in
// script-src / connect-src / frame-src or the browser will refuse to load
// clerk.browser.js with a ClerkRuntimeError("failed_to_load_clerk_js").
//
// References:
//   https://clerk.com/docs/security/content-security-policy
//   Clerk's own DEFAULT_DIRECTIVES from @clerk/nextjs/dist/esm/server/content-security-policy.js
// ──────────────────────────────────────────────────────────────────────────
const csp = [
  "default-src 'self'",

  // ❶ script-src — Clerk JS is fetched from *.clerk.accounts.dev (or
  //   a custom FAPI domain).  Using https: covers all HTTPS scripts including
  //   Clerk, Stripe, and any other HTTPS CDN.  'unsafe-inline' is required
  //   by Next.js inline scripts; 'unsafe-eval' is required in development by
  //   Turbopack / React Fast Refresh.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https: https://js.stripe.com https://checkout.stripe.com`,

  // ❷ style-src
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // ❸ font-src
  "font-src 'self' data: https://fonts.gstatic.com",

  // ❹ img-src
  "img-src 'self' data: blob: https://img.clerk.com https://images.clerkstage.dev https://images.unsplash.com https://*.cloudinary.com https://*.tile.openstreetmap.org",

  // ❺ connect-src — Clerk Accounts API, telemetry, and session endpoints
  [
    "connect-src 'self'",
    "https://*.clerk.accounts.dev",   // Clerk Frontend API (FAPI) — your dev instance
    "https://*.clerk.com",            // Clerk production
    "https://clerk-telemetry.com",    // Clerk telemetry
    "https://*.clerk-telemetry.com",  // Clerk telemetry (wildcard)
    "https://api.stripe.com",         // Stripe
    "https://nominatim.openstreetmap.org", // Geocoding
  ].join(" "),

  // ❻ frame-src — Clerk uses Cloudflare Turnstile for bot protection
  [
    "frame-src 'self'",
    "https://challenges.cloudflare.com", // Clerk bot-detection / Turnstile
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://checkout.stripe.com",
    "https://www.google.com",
    "https://maps.google.com",
  ].join(" "),

  // ❼ worker-src — Clerk uses service-worker-like blobs in some flows
  "worker-src 'self' blob:",

  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
  async headers() {
    const headers = [
      { key: "Content-Security-Policy", value: csp },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
      },
    ];

    if (!isDev) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [{ source: "/(.*)", headers }];
  },
  // Allow local /uploads directory to be served statically
  // (Next.js serves everything in /public automatically)
};

export default nextConfig;
