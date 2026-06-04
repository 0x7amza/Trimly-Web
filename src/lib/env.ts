const DEV_CUSTOMER_JWT_SECRET = "trimly-development-only-customer-jwt-secret-change-me";

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getCustomerJwtSecret() {
  const secret = process.env.CUSTOMER_JWT_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (isProduction()) {
    throw new Error("CUSTOMER_JWT_SECRET must be set to at least 32 characters in production.");
  }

  if (secret && secret.length > 0) {
    console.warn("[env] CUSTOMER_JWT_SECRET is short. Using it only because this is not production.");
    return secret;
  }

  console.warn("[env] CUSTOMER_JWT_SECRET is missing. Using development-only fallback.");
  return DEV_CUSTOMER_JWT_SECRET;
}

export function isStripeServerConfigured() {
  const secret = process.env.STRIPE_SECRET_KEY;
  return Boolean(secret && secret.startsWith("sk_"));
}

export function isStripeClientConfigured() {
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return Boolean(publishable && publishable.startsWith("pk_") && !publishable.includes("mock"));
}

export function isStripeConfigured() {
  return isStripeServerConfigured() && isStripeClientConfigured();
}

export function assertStripeConfiguredForProduction(featureName: string) {
  if (isProduction() && !isStripeServerConfigured()) {
    throw new Error(`${featureName} requires STRIPE_SECRET_KEY in production.`);
  }
}

export function assertProductionEnv() {
  if (!isProduction()) return;

  const required = [
    "MONGODB_URI",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "CUSTOMER_JWT_SECRET",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }

  getCustomerJwtSecret();
}
