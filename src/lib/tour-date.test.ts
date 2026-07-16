import { describe, expect, it } from "vitest";
import {
  normalizeStartTime,
  tourDateToUtcNoon,
  utcNoonToTourDate,
} from "./tour-date";

describe("tourDateToUtcNoon", () => {
  it("parses a calendar day to UTC noon of that day", () => {
    const result = tourDateToUtcNoon("2026-07-14");
    expect(result?.toISOString()).toBe("2026-07-14T12:00:00.000Z");
  });

  it("keeps the same calendar day regardless of an extreme timezone offset", () => {
    // UTC-14 (the most negative real offset) at noon is still 2026-07-13, and
    // UTC+14 is still 2026-07-14 — noon can't fall off the intended day.
    const utc = tourDateToUtcNoon("2026-07-14")!;
    const behind = new Date(utc.getTime() - 14 * 60 * 60 * 1000);
    const ahead = new Date(utc.getTime() + 14 * 60 * 60 * 1000);
    expect(behind.getUTCDate()).toBe(13); // 22:00 the day before — still not midnight-crossing the stored value
    expect(ahead.getUTCDate()).toBe(15);
    // The stored value itself is unambiguously the 14th.
    expect(utc.getUTCDate()).toBe(14);
  });

  it("returns null for empty, whitespace, or malformed input", () => {
    expect(tourDateToUtcNoon(null)).toBeNull();
    expect(tourDateToUtcNoon(undefined)).toBeNull();
    expect(tourDateToUtcNoon("")).toBeNull();
    expect(tourDateToUtcNoon("   ")).toBeNull();
    expect(tourDateToUtcNoon("2026/07/14")).toBeNull();
    expect(tourDateToUtcNoon("14-07-2026")).toBeNull();
    expect(tourDateToUtcNoon("2026-13-40")).toBeNull();
  });
});

describe("utcNoonToTourDate", () => {
  it("round-trips a stored instant back to YYYY-MM-DD", () => {
    const stored = tourDateToUtcNoon("2026-07-14")!;
    expect(utcNoonToTourDate(stored)).toBe("2026-07-14");
  });

  it("returns null for null/undefined", () => {
    expect(utcNoonToTourDate(null)).toBeNull();
    expect(utcNoonToTourDate(undefined)).toBeNull();
  });
});

describe("normalizeStartTime", () => {
  it("accepts valid 24h times", () => {
    expect(normalizeStartTime("09:00")).toBe("09:00");
    expect(normalizeStartTime("23:59")).toBe("23:59");
    expect(normalizeStartTime("00:00")).toBe("00:00");
    expect(normalizeStartTime("  10:30  ")).toBe("10:30");
  });

  it("rejects malformed or out-of-range times", () => {
    expect(normalizeStartTime("24:00")).toBeNull();
    expect(normalizeStartTime("9:00")).toBeNull();
    expect(normalizeStartTime("09:60")).toBeNull();
    expect(normalizeStartTime("noon")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(normalizeStartTime(null)).toBeNull();
    expect(normalizeStartTime(undefined)).toBeNull();
    expect(normalizeStartTime("")).toBeNull();
  });
});
