import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { CustomerModel } from "@/lib/models/Customer";
import { signCustomerToken } from "@/lib/auth";
import { fail, handleRouteError, ok } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { isE164Phone, isEmail, sanitizeString } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "auth:register", { limit: 5, windowMs: 10 * 60 * 1000 });
  if (limited) return limited;

  try {
    const { phone, email, password, name } = await request.json();
    const cleanPhone = sanitizeString(phone, 32);
    const cleanName = sanitizeString(name, 120);
    const cleanEmail = email ? sanitizeString(email, 254).toLowerCase() : undefined;

    if (!cleanPhone || !cleanName) {
      return fail("BAD_REQUEST", "Phone and name required", 400);
    }
    if (!isE164Phone(cleanPhone)) {
      return fail("BAD_REQUEST", "Valid international phone number required", 400);
    }
    if (cleanEmail && !isEmail(cleanEmail)) {
      return fail("BAD_REQUEST", "Valid email address required", 400);
    }
    if (password !== undefined && (typeof password !== "string" || password.length < 8 || password.length > 128)) {
      return fail("BAD_REQUEST", "Password must be between 8 and 128 characters", 400);
    }

    await connectDB();

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    let customer = await CustomerModel.findOne({ phone: cleanPhone });

    if (customer) {
      // Update existing draft customer details (e.g. name, email, passwordHash)
      customer.name = cleanName;
      if (cleanEmail) customer.email = cleanEmail;
      if (passwordHash) customer.passwordHash = passwordHash;
      await customer.save();
    } else {
      // Create new customer if not found (failsafe)
      customer = await CustomerModel.create({ phone: cleanPhone, email: cleanEmail, name: cleanName, passwordHash });
    }

    const token = await signCustomerToken(customer._id.toString());

    return ok({
      customer: { id: customer._id.toString(), phone: customer.phone, email: customer.email, name: customer.name },
      token,
    }, 201);
  } catch (err) {
    return handleRouteError("register", err);
  }
}
