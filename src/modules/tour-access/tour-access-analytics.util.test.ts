import { describe, expect, it } from "vitest";

import {
  fillMissingBuckets,
  granularityForRange,
  resolveFixedRangeWindow,
  resolveYearlyWindow,
} from "./tour-access-analytics.util";

const NOW = new Date("2026-07-21T15:32:00.000Z");

describe("granularityForRange", () => {
  it("maps each range to its bucket unit", () => {
    expect(granularityForRange("7d")).toBe("day");
    expect(granularityForRange("30d")).toBe("day");
    expect(granularityForRange("12m")).toBe("month");
    expect(granularityForRange("yearly")).toBe("year");
  });
});

describe("resolveFixedRangeWindow", () => {
  it("7d spans exactly 7 UTC calendar days including today", () => {
    const { start, end } = resolveFixedRangeWindow("7d", NOW);
    expect(start.toISOString()).toBe("2026-07-15T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-22T00:00:00.000Z");
  });

  it("30d spans exactly 30 UTC calendar days including today", () => {
    const { start, end } = resolveFixedRangeWindow("30d", NOW);
    expect(start.toISOString()).toBe("2026-06-22T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-22T00:00:00.000Z");
  });

  it("12m spans 12 rolling calendar months including the current one", () => {
    const { start, end } = resolveFixedRangeWindow("12m", NOW);
    expect(start.toISOString()).toBe("2025-08-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("12m rolls the year back correctly when now is in January", () => {
    const january = new Date("2026-01-15T00:00:00.000Z");
    const { start, end } = resolveFixedRangeWindow("12m", january);
    expect(start.toISOString()).toBe("2025-02-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });
});

describe("resolveYearlyWindow", () => {
  it("spans from the earliest grant's year through the current year", () => {
    const earliest = new Date("2025-06-01T00:00:00.000Z");
    const { start, end } = resolveYearlyWindow(earliest, NOW);
    expect(start.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("falls back to a single current-year bucket when the table is empty", () => {
    const { start, end } = resolveYearlyWindow(null, NOW);
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("fillMissingBuckets", () => {
  const dayStart = new Date("2026-07-01T00:00:00.000Z");
  const dayEnd = new Date("2026-07-04T00:00:00.000Z"); // 3 days: 01, 02, 03

  it("zero-fills every bucket when there are no rows", () => {
    const points = fillMissingBuckets([], dayStart, dayEnd, "day");
    expect(points).toEqual([
      { date: "2026-07-01", label: "Jul 1", value: 0 },
      { date: "2026-07-02", label: "Jul 2", value: 0 },
      { date: "2026-07-03", label: "Jul 3", value: 0 },
    ]);
  });

  it("places sparse rows in the correct bucket, in ascending order", () => {
    const points = fillMissingBuckets(
      [{ bucket: new Date("2026-07-02T00:00:00.000Z"), total: 16 }],
      dayStart,
      dayEnd,
      "day",
    );
    expect(points).toEqual([
      { date: "2026-07-01", label: "Jul 1", value: 0 },
      { date: "2026-07-02", label: "Jul 2", value: 16 },
      { date: "2026-07-03", label: "Jul 3", value: 0 },
    ]);
  });

  it("excludes a row exactly at the exclusive end boundary", () => {
    const points = fillMissingBuckets(
      [{ bucket: new Date("2026-07-04T00:00:00.000Z"), total: 99 }],
      dayStart,
      dayEnd,
      "day",
    );
    expect(points.map((p) => p.value)).toEqual([0, 0, 0]);
  });

  it("formats month buckets across a December-January rollover", () => {
    const start = new Date("2025-12-01T00:00:00.000Z");
    const end = new Date("2026-02-01T00:00:00.000Z"); // Dec, Jan
    const points = fillMissingBuckets(
      [{ bucket: new Date("2026-01-01T00:00:00.000Z"), total: 5 }],
      start,
      end,
      "month",
    );
    expect(points).toEqual([
      { date: "2025-12", label: "Dec 2025", value: 0 },
      { date: "2026-01", label: "Jan 2026", value: 5 },
    ]);
  });

  it("zero-fills multi-year buckets", () => {
    const start = new Date("2024-01-01T00:00:00.000Z");
    const end = new Date("2027-01-01T00:00:00.000Z"); // 2024, 2025, 2026
    const points = fillMissingBuckets(
      [{ bucket: new Date("2025-01-01T00:00:00.000Z"), total: 42 }],
      start,
      end,
      "year",
    );
    expect(points).toEqual([
      { date: "2024", label: "2024", value: 0 },
      { date: "2025", label: "2025", value: 42 },
      { date: "2026", label: "2026", value: 0 },
    ]);
  });
});
