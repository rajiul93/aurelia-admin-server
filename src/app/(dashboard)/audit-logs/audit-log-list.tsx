"use client";

import { Fragment, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  History,
  Network,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/hooks/queries/use-audit-logs";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/types/audit-log";

const ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PUBLISH",
  "ARCHIVE",
  "ROLLBACK",
] as const;

type AuditAction = (typeof ACTION_OPTIONS)[number];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function formatTimestampShort(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      date,
    ),
    time: new Intl.DateTimeFormat(undefined, { timeStyle: "medium" }).format(
      date,
    ),
  };
}

function actionPresentation(action: string) {
  switch (action as AuditAction) {
    case "CREATE":
      return {
        label: "Create",
        className:
          "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/25 dark:text-emerald-200",
        dot: "bg-emerald-500",
      };
    case "UPDATE":
      return {
        label: "Update",
        className:
          "bg-sky-500/12 text-sky-950 ring-1 ring-sky-500/25 dark:text-sky-200",
        dot: "bg-sky-500",
      };
    case "DELETE":
      return {
        label: "Delete",
        className:
          "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
        dot: "bg-destructive",
      };
    case "PUBLISH":
      return {
        label: "Publish",
        className:
          "bg-violet-500/12 text-violet-950 ring-1 ring-violet-500/30 dark:text-violet-200",
        dot: "bg-violet-500",
      };
    case "ARCHIVE":
      return {
        label: "Archive",
        className:
          "bg-slate-500/12 text-slate-700 ring-1 ring-slate-400/25 dark:text-slate-300",
        dot: "bg-slate-400",
      };
    case "ROLLBACK":
      return {
        label: "Rollback",
        className:
          "bg-amber-500/15 text-amber-950 ring-1 ring-amber-500/30 dark:text-amber-100",
        dot: "bg-amber-500",
      };
    default:
      return {
        label: action,
        className:
          "bg-muted text-muted-foreground ring-1 ring-border",
        dot: "bg-muted-foreground",
      };
  }
}

function ActionBadge({ actionType }: { actionType: string }) {
  const action = actionPresentation(actionType);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
        action.className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", action.dot)} />
      {action.label}
    </span>
  );
}

const MODULE_PALETTE = [
  "border-primary/30 bg-primary/8 text-primary",
  "border-violet-500/30 bg-violet-500/8 text-violet-900 dark:text-violet-200",
  "border-sky-500/30 bg-sky-500/8 text-sky-900 dark:text-sky-200",
  "border-emerald-500/30 bg-emerald-500/8 text-emerald-900 dark:text-emerald-200",
  "border-amber-500/30 bg-amber-500/8 text-amber-950 dark:text-amber-100",
  "border-rose-500/30 bg-rose-500/8 text-rose-900 dark:text-rose-200",
] as const;

function moduleBadgeClass(module: string) {
  let hash = 0;
  for (let i = 0; i < module.length; i += 1) {
    hash = (hash + module.charCodeAt(i) * (i + 1)) % MODULE_PALETTE.length;
  }
  return MODULE_PALETTE[hash] ?? MODULE_PALETTE[0];
}

function ModuleBadge({ module }: { module: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[11px] font-semibold tracking-tight uppercase",
        moduleBadgeClass(module),
      )}
    >
      {module}
    </Badge>
  );
}

function formatJson(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function hasPayload(entry: AuditLog) {
  return entry.previousValue != null || entry.newValue != null;
}

function AuditTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="hidden h-8 flex-1 md:block" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AuditLogList() {
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useAuditLogs({
    page: 1,
    limit: 50,
    module: moduleFilter.trim() || undefined,
    actionType: actionFilter === "all" ? undefined : actionFilter,
    entityId: entityFilter.trim() || undefined,
  });

  const records = data?.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="gap-0 overflow-hidden border-brand-tan/60 py-0 shadow-sm ring-1 ring-border/70">
        <CardHeader className="border-b border-brand-tan/40 bg-linear-to-r from-brand/8 via-brand-cream/50 to-brand-tan/30 pb-4">
          <CardTitle className="text-brand-deep flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="module-filter">Module</Label>
            <Input
              id="module-filter"
              placeholder="tour, spot, tour-access…"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              className="border-brand-tan/70 focus-visible:ring-brand/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action-filter">Action</Label>
            <select
              id="action-filter"
              className="border-input bg-background ring-offset-background focus-visible:ring-brand/30 flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              <option value="all">All actions</option>
              {ACTION_OPTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-filter">Entity ID</Label>
            <Input
              id="entity-filter"
              placeholder="Optional entity id"
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
              className="border-brand-tan/70 font-mono text-xs focus-visible:ring-brand/30"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? <AuditTableSkeleton /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load audit logs</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length === 0 ? (
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <History className="text-muted-foreground size-10" />
            <p className="font-medium">No audit entries match these filters</p>
            <p className="text-muted-foreground text-sm">
              Try clearing a filter or broadening the module name.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length > 0 ? (
        <Card className="gap-0 overflow-hidden py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep w-10 px-2 py-3.5" aria-hidden />
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    When
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Module
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Action
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Entity
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Staff
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {records.map((entry, rowIndex) => {
                  const when = formatTimestampShort(entry.createdAt);
                  const expanded = expandedId === entry.id;
                  const showDetails = hasPayload(entry);

                  return (
                    <Fragment key={entry.id}>
                      <tr
                        className={cn(
                          "transition-colors",
                          showDetails && "cursor-pointer hover:bg-brand-cream/35",
                          !showDetails && "hover:bg-brand-cream/25",
                          rowIndex % 2 === 1 && "bg-muted/15",
                          expanded && "bg-brand-cream/40",
                        )}
                        onClick={() => {
                          if (!showDetails) {
                            return;
                          }
                          setExpandedId(expanded ? null : entry.id);
                        }}
                      >
                        <td className="px-2 py-3 align-middle">
                          {showDetails ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground size-8"
                              aria-label={
                                expanded ? "Collapse details" : "Expand details"
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedId(expanded ? null : entry.id);
                              }}
                            >
                              {expanded ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                          <p className="font-medium">{when.date}</p>
                          <p className="text-muted-foreground text-xs tabular-nums">
                            {when.time}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <ModuleBadge module={entry.module} />
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <div className="flex justify-center">
                            <ActionBadge actionType={entry.actionType} />
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {entry.entityId ? (
                            <code
                              className="bg-muted/80 text-foreground inline-block max-w-[180px] truncate rounded-md px-2 py-1 font-mono text-[11px] ring-1 ring-border/60"
                              title={entry.entityId}
                            >
                              {entry.entityId}
                            </code>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {entry.staffAuthUserId ? (
                            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                              <UserRound className="text-primary size-3.5 shrink-0" />
                              <span
                                className="font-mono"
                                title={entry.staffAuthUserId}
                              >
                                {entry.staffAuthUserId.slice(0, 10)}…
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              System
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {entry.ipAddress ? (
                            <span className="text-muted-foreground inline-flex items-center gap-1.5 font-mono text-xs">
                              <Network className="size-3.5 shrink-0" />
                              {entry.ipAddress}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                      {expanded && showDetails ? (
                        <tr className="bg-brand-cream/25">
                          <td colSpan={7} className="px-4 pb-4 pt-0">
                            <div className="grid gap-3 border-t border-brand-tan/40 pt-4 md:grid-cols-2">
                              <div className="space-y-1.5">
                                <p className="text-brand-deep text-xs font-semibold tracking-wide uppercase">
                                  Previous value
                                </p>
                                <pre className="bg-background/80 text-muted-foreground max-h-48 overflow-auto rounded-lg border border-border/70 p-3 font-mono text-[11px] leading-relaxed">
                                  {formatJson(entry.previousValue)}
                                </pre>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-brand-deep text-xs font-semibold tracking-wide uppercase">
                                  New value
                                </p>
                                <pre className="bg-background/80 text-muted-foreground max-h-48 overflow-auto rounded-lg border border-border/70 p-3 font-mono text-[11px] leading-relaxed">
                                  {formatJson(entry.newValue)}
                                </pre>
                              </div>
                            </div>
                            <p className="text-muted-foreground mt-2 text-[10px]">
                              Full timestamp: {formatTimestamp(entry.createdAt)}
                            </p>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-brand-tan/40 bg-brand-cream/25 px-4 py-2.5">
            <p className="text-muted-foreground text-xs">
              {records.length} entr{records.length === 1 ? "y" : "ies"} · expand
              a row to inspect previous and new payloads
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
