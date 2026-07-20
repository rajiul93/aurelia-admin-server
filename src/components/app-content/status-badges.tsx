import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Colour here is an encoding, not decoration: lifecycle and time-of-day are the
 * two fields you scan a long asset/string list for, and a wall of identical grey
 * badges makes that a read-every-word exercise.
 *
 * Shared because the same lifecycle value was rendered as `outline` on the
 * assets page and `secondary` on the strings page — the same state looking like
 * two different things.
 */

type LifecycleValue =
  | "PLANNED"
  | "BETA"
  | "ACTIVE"
  | "DEPRECATED"
  | "HIDDEN"
  | "REMOVED";

const LIFECYCLE_STYLES: Record<LifecycleValue, string> = {
  // Live and healthy.
  ACTIVE:
    "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
  // Live but provisional.
  BETA: "bg-sky-500/12 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  // Not live yet.
  PLANNED:
    "bg-violet-500/12 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
  // On the way out — warm colours, in increasing severity.
  DEPRECATED:
    "bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  HIDDEN:
    "bg-muted text-muted-foreground dark:bg-muted/60 dark:text-muted-foreground",
  REMOVED:
    "bg-rose-500/12 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
};

export function LifecycleBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const style = LIFECYCLE_STYLES[value as LifecycleValue];

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", style, className)}
    >
      {value}
    </Badge>
  );
}

type TimeOfDayValue = "MORNING" | "AFTERNOON" | "EVENING";

/** Roughly the light at that hour, so the badge reads before the word does. */
const TIME_OF_DAY_STYLES: Record<TimeOfDayValue, string> = {
  MORNING:
    "bg-amber-400/15 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200",
  AFTERNOON:
    "bg-orange-500/12 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300",
  EVENING:
    "bg-indigo-500/12 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
};

export function TimeOfDayBadge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const style = TIME_OF_DAY_STYLES[value as TimeOfDayValue];

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", style, className)}
    >
      {value}
    </Badge>
  );
}
