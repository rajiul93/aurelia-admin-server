/**
 * Normalize AppReleaseConfig.reminderOffsetDays (Prisma Json) into a clean
 * int[] for admin UI + API responses. Falls back to [3, 2, 1] when missing or
 * garbage so the panel never crashes on `.join`.
 */
export function normalizeReminderOffsetDays(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [3, 2, 1];
  }

  const cleaned = Array.from(
    new Set(
      value
        .filter((item): item is number => typeof item === "number")
        .map((item) => Math.trunc(item))
        .filter((item) => Number.isFinite(item) && item >= 0 && item <= 60),
    ),
  ).sort((a, b) => b - a);

  // Explicit empty array means "prep reminders off" — keep it.
  // Non-array / all-garbage falls through to the default above.
  if (cleaned.length === 0 && value.length === 0) {
    return [];
  }

  return cleaned.length > 0 ? cleaned : [3, 2, 1];
}

export function normalizeReminderHour(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 9;
  }

  const hour = Math.trunc(value);
  return hour >= 0 && hour <= 23 ? hour : 9;
}

export function normalizeReminderNudgeEnabled(value: unknown): boolean {
  return value !== false;
}
