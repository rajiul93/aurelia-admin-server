export type AnalyticsRange = "7d" | "30d" | "12m" | "yearly";
export type BucketGranularity = "day" | "month" | "year";
export type BucketRow = { bucket: Date; total: number };
export type SeriesPoint = { date: string; label: string; value: number };

export function granularityForRange(range: AnalyticsRange): BucketGranularity {
  if (range === "12m") return "month";
  if (range === "yearly") return "year";
  return "day";
}

/**
 * UTC calendar boundaries for the two fixed-window ranges. `end` is exclusive
 * (start of the day/month after the window). `now` is injected so this stays
 * pure and deterministic in tests.
 */
export function resolveFixedRangeWindow(
  range: "7d" | "30d" | "12m",
  now: Date,
): { start: Date; end: Date } {
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(todayStart);
  end.setUTCDate(end.getUTCDate() + 1);

  if (range === "7d") {
    const start = new Date(todayStart);
    start.setUTCDate(start.getUTCDate() - 6);
    return { start, end };
  }

  if (range === "30d") {
    const start = new Date(todayStart);
    start.setUTCDate(start.getUTCDate() - 29);
    return { start, end };
  }

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end: monthEnd };
}

/**
 * "Yearly" spans the whole dataset: from the year of the earliest TourAccess
 * row through the current year. A `null` earliest date (empty table) falls
 * back to a single current-year bucket.
 */
export function resolveYearlyWindow(
  earliestCreatedAt: Date | null,
  now: Date,
): { start: Date; end: Date } {
  const startYear = earliestCreatedAt
    ? earliestCreatedAt.getUTCFullYear()
    : now.getUTCFullYear();
  return {
    start: new Date(Date.UTC(startYear, 0, 1)),
    end: new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function bucketKey(date: Date, granularity: BucketGranularity): string {
  const year = date.getUTCFullYear();
  if (granularity === "year") return String(year);
  const month = pad(date.getUTCMonth() + 1);
  if (granularity === "month") return `${year}-${month}`;
  return `${year}-${month}-${pad(date.getUTCDate())}`;
}

function stepBucket(date: Date, granularity: BucketGranularity): Date {
  const next = new Date(date);
  if (granularity === "day") next.setUTCDate(next.getUTCDate() + 1);
  else if (granularity === "month") next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
}

// timeZone: "UTC" is load-bearing — without it, label formatting depends on
// the server's local TZ and can shift a bucket onto the wrong day/month.
const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  timeZone: "UTC",
});

function formatBucketLabel(date: Date, granularity: BucketGranularity): string {
  if (granularity === "day") return DAY_FORMATTER.format(date);
  if (granularity === "month") return MONTH_FORMATTER.format(date);
  return YEAR_FORMATTER.format(date);
}

/**
 * Merges sparse DB rows onto every bucket in [start, end), zero-filling gaps.
 * Pure — no Prisma import — fully unit-testable without a database.
 */
export function fillMissingBuckets(
  rows: BucketRow[],
  start: Date,
  end: Date,
  granularity: BucketGranularity,
): SeriesPoint[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(bucketKey(row.bucket, granularity), row.total);
  }

  const points: SeriesPoint[] = [];
  let cursor = new Date(start);
  while (cursor < end) {
    const key = bucketKey(cursor, granularity);
    points.push({
      date: key,
      label: formatBucketLabel(cursor, granularity),
      value: totals.get(key) ?? 0,
    });
    cursor = stepBucket(cursor, granularity);
  }
  return points;
}
