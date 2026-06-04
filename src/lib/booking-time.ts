export const DEFAULT_TIME_ZONE = "UTC";
export const SLOT_INTERVAL_MINUTES = 15;
export const DEFAULT_BOOKING_BUFFER_MINUTES = 15;

export interface BusinessHoursLike {
  day: number;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface BookingRangeLike {
  startTime: Date | string;
  endTime: Date | string;
}

export type BookingTimeErrorCode = "PAST_BOOKING" | "SLOT_UNAVAILABLE" | "VALIDATION_ERROR";

export type BookingTimeValidation =
  | {
      ok: true;
      start: Date;
      end: Date;
      timeZone: string;
      dateStr: string;
      open: Date;
      close: Date;
    }
  | {
      ok: false;
      code: BookingTimeErrorCode;
      message: string;
    };

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function getBookingBufferMinutes() {
  const value = Number(process.env.NEXT_PUBLIC_BOOKING_BUFFER_MINUTES ?? DEFAULT_BOOKING_BUFFER_MINUTES);
  return Number.isInteger(value) && value >= 0 && value <= 24 * 60
    ? value
    : DEFAULT_BOOKING_BUFFER_MINUTES;
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(value: unknown) {
  return isValidTimeZone(value) ? value : DEFAULT_TIME_ZONE;
}

export function getDateTimePartsInTimeZone(date: Date, timeZoneValue?: string) {
  const timeZone = normalizeTimeZone(timeZoneValue);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour) === 24 ? 0 : Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function formatDateInTimeZone(date: Date, timeZoneValue?: string) {
  const parts = getDateTimePartsInTimeZone(date, timeZoneValue);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatTimeInTimeZone(date: Date, timeZoneValue?: string) {
  const parts = getDateTimePartsInTimeZone(date, timeZoneValue);
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function addDaysToDateString(dateStr: string, amount: number) {
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function getDayOfWeekForDateString(dateStr: string) {
  return new Date(`${dateStr}T12:00:00.000Z`).getUTCDay();
}

export function zonedDateTimeToUtc(dateStr: string, timeStr: string, timeZoneValue?: string) {
  const timeZone = normalizeTimeZone(timeZoneValue);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!dateMatch || !timeMatch) return null;

  const target = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  if (target.hour > 23 || target.minute > 59) return null;

  const targetAsUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, 0, 0);
  let resultMs = targetAsUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = getDateTimePartsInTimeZone(new Date(resultMs), timeZone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      0,
      0
    );
    const difference = targetAsUtc - observedAsUtc;
    resultMs += difference;
    if (difference === 0) break;
  }

  const result = new Date(resultMs);
  const check = getDateTimePartsInTimeZone(result, timeZone);
  if (
    check.year !== target.year ||
    check.month !== target.month ||
    check.day !== target.day ||
    check.hour !== target.hour ||
    check.minute !== target.minute
  ) {
    return null;
  }

  return result;
}

export function getDateRangeInTimeZone(dateStr: string, timeZoneValue?: string) {
  const timeZone = normalizeTimeZone(timeZoneValue);
  const start = zonedDateTimeToUtc(dateStr, "00:00", timeZone);
  const end = zonedDateTimeToUtc(addDaysToDateString(dateStr, 1), "00:00", timeZone);
  return start && end ? { start, end, timeZone } : null;
}

export function roundUpToInterval(date: Date, intervalMinutes = SLOT_INTERVAL_MINUTES) {
  const intervalMs = intervalMinutes * 60 * 1000;
  return new Date(Math.ceil(date.getTime() / intervalMs) * intervalMs);
}

export function getEarliestBookableTime(
  now = new Date(),
  bufferMinutes = getBookingBufferMinutes()
) {
  return roundUpToInterval(new Date(now.getTime() + bufferMinutes * 60 * 1000));
}

export function getScheduleWindow(
  dateStr: string,
  businessHours: BusinessHoursLike[] | undefined,
  timeZoneValue?: string
) {
  const timeZone = normalizeTimeZone(timeZoneValue);
  const day = getDayOfWeekForDateString(dateStr);
  const dayHours = businessHours?.find((hours) => hours.day === day);
  if (dayHours?.isClosed) return null;

  const openTime = dayHours?.open ?? "09:00";
  const closeTime = dayHours?.close ?? "18:00";
  const open = zonedDateTimeToUtc(dateStr, openTime, timeZone);
  const close = zonedDateTimeToUtc(dateStr, closeTime, timeZone);

  if (!open || !close || close.getTime() <= open.getTime()) return null;
  return { day, open, close, openTime, closeTime, timeZone };
}

export function validateBookingTime({
  start,
  durationMinutes,
  businessHours,
  timeZone,
  now = new Date(),
  enforceBuffer = false,
  bufferMinutes = getBookingBufferMinutes(),
}: {
  start: Date;
  durationMinutes: number;
  businessHours?: BusinessHoursLike[];
  timeZone?: string;
  now?: Date;
  enforceBuffer?: boolean;
  bufferMinutes?: number;
}): BookingTimeValidation {
  if (
    Number.isNaN(start.getTime()) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 5 ||
    durationMinutes > 12 * 60
  ) {
    return { ok: false, code: "VALIDATION_ERROR", message: "Invalid booking time or service duration" };
  }

  const normalizedTimeZone = normalizeTimeZone(timeZone);
  const localStartParts = getDateTimePartsInTimeZone(start, normalizedTimeZone);
  if (
    localStartParts.minute % SLOT_INTERVAL_MINUTES !== 0 ||
    localStartParts.second !== 0 ||
    start.getMilliseconds() !== 0
  ) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: `Appointments must start on a ${SLOT_INTERVAL_MINUTES}-minute interval`,
    };
  }

  if (start.getTime() < now.getTime()) {
    return { ok: false, code: "PAST_BOOKING", message: "Cannot book an appointment in the past" };
  }

  if (enforceBuffer && start.getTime() < getEarliestBookableTime(now, bufferMinutes).getTime()) {
    return {
      ok: false,
      code: "SLOT_UNAVAILABLE",
      message: "This time is too close to the current time. Please choose a later slot.",
    };
  }

  const dateStr = formatDateInTimeZone(start, normalizedTimeZone);
  const window = getScheduleWindow(dateStr, businessHours, normalizedTimeZone);
  if (!window) {
    return { ok: false, code: "SLOT_UNAVAILABLE", message: "The shop is closed at this time" };
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  if (start.getTime() < window.open.getTime() || end.getTime() > window.close.getTime()) {
    return {
      ok: false,
      code: "SLOT_UNAVAILABLE",
      message: "This appointment falls outside the shop opening hours",
    };
  }

  return {
    ok: true,
    start,
    end,
    timeZone: normalizedTimeZone,
    dateStr,
    open: window.open,
    close: window.close,
  };
}

export function generateAvailableSlotStarts({
  dateStr,
  durationMinutes,
  businessHours,
  timeZone,
  bookings,
  now = new Date(),
  bufferMinutes = getBookingBufferMinutes(),
}: {
  dateStr: string;
  durationMinutes: number;
  businessHours?: BusinessHoursLike[];
  timeZone?: string;
  bookings: BookingRangeLike[];
  now?: Date;
  bufferMinutes?: number;
}) {
  const normalizedTimeZone = normalizeTimeZone(timeZone);
  const today = formatDateInTimeZone(now, normalizedTimeZone);
  if (dateStr < today) return [];

  const window = getScheduleWindow(dateStr, businessHours, normalizedTimeZone);
  if (!window) return [];

  const earliest = dateStr === today ? getEarliestBookableTime(now, bufferMinutes).getTime() : null;
  const durationMs = durationMinutes * 60 * 1000;
  const intervalMs = SLOT_INTERVAL_MINUTES * 60 * 1000;
  const slots: Date[] = [];

  for (
    let slotStartMs = window.open.getTime();
    slotStartMs + durationMs <= window.close.getTime();
    slotStartMs += intervalMs
  ) {
    if (earliest !== null && slotStartMs < earliest) continue;

    const slotEndMs = slotStartMs + durationMs;
    const overlaps = bookings.some((booking) => {
      const bookingStartMs = new Date(booking.startTime).getTime();
      const bookingEndMs = new Date(booking.endTime).getTime();
      return slotStartMs < bookingEndMs && slotEndMs > bookingStartMs;
    });

    if (!overlaps) slots.push(new Date(slotStartMs));
  }

  return slots;
}
