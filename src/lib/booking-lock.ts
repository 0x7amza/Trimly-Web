import { randomUUID } from "crypto";
import { BookingLockModel } from "@/lib/models/BookingLock";

const LOCK_DURATION_MS = 10_000;
const LOCK_RETRY_DELAY_MS = 75;
const LOCK_RETRY_COUNT = 20;

export class BookingLockUnavailableError extends Error {
  constructor() {
    super("This time is no longer available. Please choose another slot.");
    this.name = "BookingLockUnavailableError";
  }
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withBarberBookingLock<T>(barberId: string, task: () => Promise<T>) {
  const ownerToken = randomUUID();
  let acquired = false;

  for (let attempt = 0; attempt < LOCK_RETRY_COUNT; attempt += 1) {
    const now = new Date();
    try {
      const lock = await BookingLockModel.findOneAndUpdate(
        {
          barberId,
          $or: [{ expiresAt: { $lte: now } }, { ownerToken }],
        },
        {
          $set: {
            ownerToken,
            expiresAt: new Date(now.getTime() + LOCK_DURATION_MS),
          },
        },
        { upsert: true, new: true }
      ).lean();

      if (lock?.ownerToken === ownerToken) {
        acquired = true;
        break;
      }
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }

    await wait(LOCK_RETRY_DELAY_MS);
  }

  if (!acquired) throw new BookingLockUnavailableError();

  try {
    return await task();
  } finally {
    await BookingLockModel.deleteOne({ barberId, ownerToken }).catch(() => undefined);
  }
}
