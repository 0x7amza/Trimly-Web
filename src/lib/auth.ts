import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { connectDB } from "./db";
import { BarberModel } from "./models/Barber";
import { getCustomerJwtSecret } from "./env";
import { fail } from "./api-response";

function getCustomerJwtSecretKey() {
  return new TextEncoder().encode(getCustomerJwtSecret());
}

// ──────────────────────────────────────────────
// B2B: Clerk Auth helpers
// ──────────────────────────────────────────────

/**
 * Returns the Clerk userId from the current request.
 * Throws a 401 NextResponse if not authenticated.
 */
export async function requireClerkAuth(): Promise<string | NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return fail("UNAUTHORIZED", "Unauthorized. Clerk authentication required.", 401);
  }
  return userId;
}

/**
 * Returns the barber document for the authenticated Clerk user.
 * Throws 401 if not authenticated, 404 if barber record not found.
 */
export async function requireBarber() {
  const userIdOrResponse = await requireClerkAuth();
  if (userIdOrResponse instanceof NextResponse) return { error: userIdOrResponse };

  await connectDB();
  const barber = await BarberModel.findOne({ clerkId: userIdOrResponse });
  if (!barber) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Barber profile not found. Please sync first." } },
        { status: 404 }
      ),
    };
  }
  return { barber, clerkId: userIdOrResponse };
}

/**
 * Like requireBarber but also checks the barber is an OWNER.
 */
export async function requireOwner() {
  const result = await requireBarber();
  if ("error" in result) return result;

  if (result.barber.role !== "OWNER") {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Forbidden. Only shop owners can perform this action." } },
        { status: 403 }
      ),
    };
  }
  return result;
}

// ──────────────────────────────────────────────
// B2C: Customer JWT helpers
// ──────────────────────────────────────────────

export async function signCustomerToken(customerId: string): Promise<string> {
  return new SignJWT({ sub: customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getCustomerJwtSecretKey());
}

export async function verifyCustomerToken(request: NextRequest): Promise<string | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return fail("UNAUTHORIZED", "Unauthorized. Customer token missing.", 401);
  }

  try {
    const { payload } = await jwtVerify(token, getCustomerJwtSecretKey());
    return payload.sub as string;
  } catch {
    return fail("UNAUTHORIZED", "Unauthorized. Invalid or expired token.", 401);
  }
}
