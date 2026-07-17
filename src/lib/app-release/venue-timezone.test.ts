import { describe, it, expect } from "vitest";
import {
  DEFAULT_VENUE_TIMEZONE,
  isValidTimezone,
  normalizeVenueTimezone,
  venueWallClock,
} from "./venue-timezone";

describe("isValidTimezone", () => {
  it("accepts IANA zones", () => {
    expect(isValidTimezone("Europe/Rome")).toBe(true);
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("UTC")).toBe(true);
  });

  it("rejects nonsense", () => {
    expect(isValidTimezone("Not/AZone")).toBe(false);
    expect(isValidTimezone("Rome")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});

describe("normalizeVenueTimezone", () => {
  it("keeps a valid zone", () => {
    expect(normalizeVenueTimezone("America/New_York")).toBe("America/New_York");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeVenueTimezone("  Europe/Rome  ")).toBe("Europe/Rome");
  });

  it("falls back on garbage rather than throwing", () => {
    // The column is a plain String, so nothing at the DB level stops a bad
    // write; every read has to survive one.
    expect(normalizeVenueTimezone("Not/AZone")).toBe(DEFAULT_VENUE_TIMEZONE);
    expect(normalizeVenueTimezone("")).toBe(DEFAULT_VENUE_TIMEZONE);
    expect(normalizeVenueTimezone(null)).toBe(DEFAULT_VENUE_TIMEZONE);
    expect(normalizeVenueTimezone(undefined)).toBe(DEFAULT_VENUE_TIMEZONE);
    expect(normalizeVenueTimezone(42)).toBe(DEFAULT_VENUE_TIMEZONE);
    expect(normalizeVenueTimezone({})).toBe(DEFAULT_VENUE_TIMEZONE);
  });
});

describe("venueWallClock", () => {
  it("converts an instant to the venue's wall clock", () => {
    const instant = new Date("2026-07-17T08:30:00Z");

    expect(venueWallClock(instant, "Europe/Rome")).toBe("10:30"); // CEST, UTC+2
    expect(venueWallClock(instant, "America/New_York")).toBe("04:30");
    expect(venueWallClock(instant, "UTC")).toBe("08:30");
  });

  it("renders midnight as 00, not 24", () => {
    expect(venueWallClock(new Date("2026-07-17T22:00:00Z"), "Europe/Rome")).toBe(
      "00:00",
    );
  });

  it("zero-pads to a comparable HH:mm", () => {
    // The result is string-compared against "HH:mm" opening hours, so a
    // "9:05" would sort wrong against "09:00".
    expect(venueWallClock(new Date("2026-07-17T07:05:00Z"), "Europe/Rome")).toBe(
      "09:05",
    );
  });

  it("falls back to the default venue on a bad zone", () => {
    expect(venueWallClock(new Date("2026-07-17T08:30:00Z"), "Not/AZone")).toBe(
      "10:30",
    );
  });
});
