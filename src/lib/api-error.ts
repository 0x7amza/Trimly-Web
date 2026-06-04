export function getClientErrorMessage(payload: unknown, fallback = "API Request Failed") {
  if (!payload || typeof payload !== "object") return fallback;
  const maybeError = (payload as { error?: unknown }).error;
  if (typeof maybeError === "string") return maybeError;
  if (maybeError && typeof maybeError === "object") {
    const message = (maybeError as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export function getClientErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const maybeError = (payload as { error?: unknown }).error;
  if (!maybeError || typeof maybeError !== "object") return undefined;
  const code = (maybeError as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

export class ApiRequestError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}
