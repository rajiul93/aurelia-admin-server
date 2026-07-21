"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTourAccessAnalyticsSeries,
  useTourAccessAnalyticsSummary,
} from "@/hooks/queries/use-tour-access";
import { cn } from "@/lib/utils";
import type { AnalyticsRange } from "@/types/tour-access";
import { STAT_CARD_SHELL } from "./dashboard-ui";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "12m", label: "Last 12 Months" },
  { value: "yearly", label: "Yearly" },
];

const numberFormatter = new Intl.NumberFormat();

function SummaryCard({
  title,
  description,
  value,
  isLoading,
  isError,
}: {
  title: string;
  description: string;
  value: number | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <Card className={cn(STAT_CARD_SHELL, "hover:ring-violet-500/40")}>
      <div className="h-1 bg-linear-to-r from-violet-500 via-violet-400 to-brand-cream" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-2">
        <div>
          <CardTitle className="text-brand-deep text-xs font-semibold tracking-wider uppercase">
            {title}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/12 ring-1 ring-violet-500/25">
          <Smartphone className="size-5 text-violet-700 dark:text-violet-300" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading && <Skeleton className="h-9 w-16" />}
        {isError && (
          <p className="text-destructive text-sm">Could not load</p>
        )}
        {!isLoading && !isError && (
          <p className="text-brand-deep text-3xl font-bold tabular-nums tracking-tight">
            {numberFormatter.format(value ?? 0)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = typeof payload[0]?.value === "number" ? payload[0].value : 0;

  return (
    <div className="border-border/70 bg-popover rounded-lg border px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{label}</p>
      <p className="text-brand-deep text-sm font-semibold tabular-nums">
        {numberFormatter.format(value)} device{value === 1 ? "" : "s"} granted
      </p>
    </div>
  );
}

export function DeviceAccessAnalyticsSection() {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const summary = useTourAccessAnalyticsSummary();
  const seriesQuery = useTourAccessAnalyticsSeries(range);

  const series = seriesQuery.data?.data.series ?? [];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Granted today"
          description="Device access"
          value={summary.data?.data.today}
          isLoading={summary.isLoading}
          isError={summary.isError}
        />
        <SummaryCard
          title="Last 7 days"
          description="Device access"
          value={summary.data?.data.last7Days}
          isLoading={summary.isLoading}
          isError={summary.isError}
        />
        <SummaryCard
          title="This month"
          description="Device access"
          value={summary.data?.data.thisMonth}
          isLoading={summary.isLoading}
          isError={summary.isError}
        />
        <SummaryCard
          title="Total granted"
          description="All time"
          value={summary.data?.data.total}
          isLoading={summary.isLoading}
          isError={summary.isError}
        />
      </div>

      <Card className="gap-0 overflow-hidden border-0 py-0 shadow-lg ring-1 ring-border/70">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 px-5 pt-5 pb-3">
          <div>
            <CardTitle className="text-brand-deep text-sm font-semibold">
              Device access granted
            </CardTitle>
            <CardDescription className="text-xs">
              Total device seats granted per period
            </CardDescription>
          </div>
          <select
            className="border-input bg-background ring-offset-background focus-visible:ring-brand/30 flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:outline-none"
            value={range}
            onChange={(event) =>
              setRange(event.target.value as AnalyticsRange)
            }
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {seriesQuery.isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : seriesQuery.isError ? (
            <p className="text-destructive text-sm">
              Could not load analytics
            </p>
          ) : (
            <div
              className={cn(
                "transition-opacity",
                seriesQuery.isFetching && "opacity-60",
              )}
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={series}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeOpacity={0.6}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    interval={range === "30d" ? "preserveStartEnd" : 0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value: number) =>
                      numberFormatter.format(value)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "var(--brand-cream)", opacity: 0.4 }}
                    content={<AnalyticsTooltip />}
                  />
                  <Bar
                    dataKey="value"
                    fill="#810b38"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={series.length > 15 ? 14 : 24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
