"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogs } from "@/hooks/queries/use-audit-logs";

const ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PUBLISH",
  "ARCHIVE",
  "ROLLBACK",
] as const;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function AuditLogList() {
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState("");

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
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="module-filter">Module</Label>
            <Input
              id="module-filter"
              placeholder="tour, spot, ai-knowledge…"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action-filter">Action</Label>
            <select
              id="action-filter"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
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
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

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
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="font-medium">No audit entries match these filters</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length > 0 ? (
        <div className="space-y-3">
          {records.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{entry.module}</Badge>
                  <Badge variant="secondary">{entry.actionType}</Badge>
                  {entry.entityId ? (
                    <Badge variant="outline" className="font-mono text-xs">
                      {entry.entityId}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-sm">
                  {formatTimestamp(entry.createdAt)}
                  {entry.staffAuthUserId
                    ? ` · staff ${entry.staffAuthUserId.slice(0, 8)}…`
                    : ""}
                  {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
