import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PAYMENT_UNAVAILABLE"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function okMessage(message: string, status = 200) {
  return NextResponse.json({ success: true, message }, { status });
}

export function fail(code: ApiErrorCode, message: string, status = 400, headers?: HeadersInit) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status, headers }
  );
}

export function handleRouteError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
  return fail("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
}
