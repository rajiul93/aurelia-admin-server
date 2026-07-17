import { venueWallClock } from "@/lib/app-release/venue-timezone";

/**
 * Is the host on duty right now?
 *
 * availableFrom/availableTo are bare "HH:mm" strings on the venue's clock, so
 * they can only be compared against the venue's wall clock. Reading the host
 * machine's clock instead (the server runs in UTC on Vercel) shifts every
 * window by the venue's UTC offset — a Rome host on 09:00–17:00 would read as
 * offline until 11:00 local in summer. The zone comes from
 * AppReleaseConfig.venueTimezone.
 */
export function computeIsAvailableNow(
  isActive: boolean,
  availableFrom: string | null,
  availableTo: string | null,
  timezone: string,
  now = new Date()
): boolean {
  if (!isActive) return false;

  if (!availableFrom || !availableTo) return true;

  const currentTime = venueWallClock(now, timezone);

  if (availableFrom <= availableTo) {
    return currentTime >= availableFrom && currentTime < availableTo;
  }

  // Window wraps past midnight (e.g. 22:00–02:00).
  return currentTime >= availableFrom || currentTime < availableTo;
}
