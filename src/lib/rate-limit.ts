import { NextRequest } from "next/server";
import { fail } from "@/lib/api-response";

type Bucket = {
  count: number;
  resetAt: number;
};

const globalWithRateLimit = global as typeof globalThis & {
  _trimlyRateLimit?: Map<string, Bucket>;
};

if (!globalWithRateLimit._trimlyRateLimit) {
  globalWithRateLimit._trimlyRateLimit = new Map();
}

const buckets = globalWithRateLimit._trimlyRateLimit;

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(
  request: NextRequest,
  scope: string,
  options: { limit: number; windowMs: number; identity?: string }
) {
  const now = Date.now();
  const key = `${scope}:${getClientIp(request)}:${options.identity || ""}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count <= options.limit) return null;

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return fail("RATE_LIMITED", "Too many attempts. Please wait and try again.", 429, {
    "Retry-After": retryAfter.toString(),
  });
}
