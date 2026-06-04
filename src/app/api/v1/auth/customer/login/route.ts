import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models/Customer";
import { signCustomerToken } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth:customer-login", { limit: 8, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  try {
    const { identifier, password } = await request.json();
    const cleanIdentifier = sanitizeString(identifier, 254);
    if (!cleanIdentifier || typeof password !== "string") {
      return fail("BAD_REQUEST", "Identifier and password required", 400);
    }

    await connectDB();

    const customer = await CustomerModel.findOne({
      $or: [{ email: cleanIdentifier.toLowerCase() }, { phone: cleanIdentifier }],
    });

    if (!customer || !customer.passwordHash) {
      return fail("UNAUTHORIZED", "Invalid credentials", 401);
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      return fail("UNAUTHORIZED", "Invalid credentials", 401);
    }

    const token = await signCustomerToken(customer._id.toString());

    return ok({
      customer: {
        id: customer._id.toString(),
        phone: customer.phone,
        email: customer.email,
        name: customer.name,
      },
      token,
    });
  } catch (err) {
    return handleRouteError("login", err);
  }
}
