import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { connectDB } from "./db";
import { BarberModel } from "./models/Barber";

const CUSTOMER_JWT_SECRET = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || "fallback-secret"
);

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
    return NextResponse.json(
      { success: false, error: "Unauthorized. Clerk authentication required." },
      { status: 401 }
    );
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
        { success: false, error: "Barber profile not found. Please sync first." },
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
        { success: false, error: "Forbidden. Only shop owners can perform this action." },
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
    .sign(CUSTOMER_JWT_SECRET);
}

export async function verifyCustomerToken(request: NextRequest): Promise<string | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Customer token missing." },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, CUSTOMER_JWT_SECRET);
    return payload.sub as string;
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Invalid or expired token." },
      { status: 401 }
    );
  }
}
