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
