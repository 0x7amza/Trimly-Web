export const objectIdPattern = /^[a-f\d]{24}$/i;
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const e164PhonePattern = /^\+[1-9]\d{6,14}$/;

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && objectIdPattern.test(value);
}

export function isSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 80 && slugPattern.test(value);
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function isE164Phone(value: unknown): value is string {
  return typeof value === "string" && e164PhonePattern.test(value.trim());
}

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function isIsoDateTime(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

export function isPositiveInt(value: unknown, min = 1, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function isPriceMinorUnit(value: unknown) {
  return isPositiveInt(value, 1, 10_000_000);
}

export function sanitizeString(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "12")));
  return { page, limit };
}
