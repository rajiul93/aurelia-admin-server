/**
 * The venue's wall-clock timezone. Host opening hours are stored as bare
 * "HH:mm" strings with no zone, so they only mean something against a specific
 * zone — and neither end of the wire can supply it: the server runs in UTC on
 * Vercel, and a visitor's phone carries whatever zone they flew in with. The
 * zone therefore comes from admin-editable remote config.
 *
 * DEFAULT_VENUE_TIMEZONE is a data default matching the DB column default, not
 * a business rule — it seeds a fresh config row and catches garbage. Business
 * logic must always read the configured value.
 */
export const DEFAULT_VENUE_TIMEZONE = "Europe/Rome";

export function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function normalizeVenueTimezone(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_VENUE_TIMEZONE;
  }

  const trimmed = value.trim();
  return trimmed && isValidTimezone(trimmed) ? trimmed : DEFAULT_VENUE_TIMEZONE;
}

/**
 * The venue's current wall clock as "HH:mm", for comparing against the bare
 * "HH:mm" opening hours. formatToParts (not a formatted string) so no locale
 * can slip in a stray character, and hourCycle "h23" so midnight is "00", not
 * "24" as some locales render it.
 */
export function venueWallClock(now: Date, timezone: string): string {
  const zone = isValidTimezone(timezone) ? timezone : DEFAULT_VENUE_TIMEZONE;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${hour}:${minute}`;
}
