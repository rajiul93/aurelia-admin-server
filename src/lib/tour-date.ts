/**
 * A tour's visit date is a *calendar day*, not an instant. The buyer sets "I'm
 * visiting on the 14th"; the mobile app then schedules prep reminders at 09:00
 * device-local on D-3/D-2/D-1. To keep that day stable no matter where the
 * device (or server) sits, we store it as **UTC noon** of the calendar day —
 * far enough from either midnight that no realistic timezone offset (max ±14h)
 * can roll it onto the day before or after.
 *
 * `startTime` is a separate free-form "HH:mm" (24h) string used only in copy
 * ("arrive 30 min before your 10:00 start"); it is never combined into the
 * stored instant, so DST math never touches it.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * "YYYY-MM-DD" (the value an `<input type="date">` yields) → a Date at UTC noon
 * of that calendar day. Returns null for empty/invalid input so callers can
 * treat "no date" and "bad date" the same way.
 */
export function tourDateToUtcNoon(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!DATE_ONLY.test(trimmed)) {
    return null;
  }

  const date = new Date(`${trimmed}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * The stored UTC-noon instant → back to the "YYYY-MM-DD" the mobile client and
 * admin form expect. Reads UTC components, which is exactly the day we stored.
 */
export function utcNoonToTourDate(date: Date | null | undefined): string | null {
  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

/** Optional "HH:mm" 24h start time; null for empty, and rejects malformed input. */
export function normalizeStartTime(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!TIME_24H.test(trimmed)) {
    return null;
  }

  return trimmed;
}
