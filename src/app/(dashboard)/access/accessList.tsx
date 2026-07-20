"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Ban,
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useDeleteTourAccess,
  useRevokeTourAccess,
} from "@/hooks/mutations/use-tour-access-mutations";
import { useTourAccessList } from "@/hooks/queries/use-tour-access";
import { cn } from "@/lib/utils";
import type { TourAccess, TourAccessStatus } from "@/types/tour-access";

type EffectiveStatus = TourAccessStatus | "PENDING";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusPresentation(status: EffectiveStatus) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Active",
        dot: "bg-emerald-500",
        className:
          "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/25 dark:text-emerald-200",
      };
    case "PENDING":
      return {
        label: "Pending",
        dot: "bg-amber-500",
        className:
          "bg-amber-500/15 text-amber-950 ring-1 ring-amber-500/30 dark:text-amber-100",
      };
    case "EXPIRED":
      return {
        label: "Expired",
        dot: "bg-slate-400",
        className:
          "bg-slate-500/12 text-slate-700 ring-1 ring-slate-400/25 dark:text-slate-300",
      };
    case "REVOKED":
      return {
        label: "Revoked",
        dot: "bg-destructive",
        className:
          "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
      };
  }
}

function AccessStatusBadge({
  effectiveStatus,
  storedStatus,
}: {
  effectiveStatus: EffectiveStatus;
  storedStatus: TourAccessStatus;
}) {
  const status = statusPresentation(effectiveStatus);

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
          status.className,
        )}
      >
        <span className={cn("size-1.5 shrink-0 rounded-full", status.dot)} />
        {status.label}
      </span>
      {effectiveStatus !== storedStatus ? (
        <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          Stored: {storedStatus}
        </span>
      ) : null}
    </div>
  );
}

function DeviceSeatMeter({
  active,
  max,
}: {
  active: number;
  max: number;
}) {
  const ratio = max > 0 ? Math.min(active / max, 1) : 0;
  const full = active >= max && max > 0;

  return (
    <div className="min-w-[96px] space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
        <Smartphone className="text-primary size-3.5 shrink-0" />
        <span>
          {active}
          <span className="text-muted-foreground font-normal"> / {max}</span>
        </span>
      </div>
      <div className="bg-muted/80 h-2 w-full overflow-hidden rounded-full ring-1 ring-border/60">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            full
              ? "bg-linear-to-r from-destructive to-rose-500"
              : active > 0
                ? "bg-linear-to-r from-primary to-brand-deep"
                : "bg-muted-foreground/25",
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

function TourChips({ tours }: { tours: TourAccess["tours"] }) {
  const visible = tours.slice(0, 2);
  const rest = tours.length - visible.length;

  return (
    <div className="flex max-w-[220px] flex-wrap gap-1">
      {visible.map((tour) => (
        <Badge
          key={tour.id}
          variant="outline"
          className="border-brand-tan/80 bg-brand-cream/50 text-brand-deep max-w-full truncate font-normal"
        >
          {tour.title}
        </Badge>
      ))}
      {rest > 0 ? (
        <Badge variant="secondary" className="shrink-0">
          +{rest}
        </Badge>
      ) : null}
    </div>
  );
}

function AccessTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="space-y-0 divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="hidden h-8 flex-1 md:block" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AccessList() {
  const { data, isLoading, isError, error, refetch } = useTourAccessList({
    page: 1,
    limit: 50,
  });
  const revokeAccess = useRevokeTourAccess();
  const deleteAccess = useDeleteTourAccess();
  const askConfirm = useConfirm();
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    type: "revoke" | "delete";
  } | null>(null);

  const records = data?.data ?? [];

  async function handleRevoke(id: string, phone: string) {
    const confirmed = await askConfirm({
      title: `Revoke access for ${phone}?`,
      description: "Active device sessions will lose entitlement.",
      confirmLabel: "Revoke",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingAction({ id, type: "revoke" });
    try {
      await revokeAccess.mutateAsync(id);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(id: string, phone: string) {
    const confirmed = await askConfirm({
      title: `Delete access record for ${phone}?`,
      description: "This cannot be undone.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingAction({ id, type: "delete" });
    try {
      await deleteAccess.mutateAsync(id);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">Buyer grants</h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Grant tour access by phone and 4-digit PIN. Buyers unlock once on
            the app; device seats and expiry are enforced on every session.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/access/new" />}>
          <Plus className="size-4" />
          Grant access
        </Button>
      </div>

      {isLoading ? <AccessTableSkeleton /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load access records</p>
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
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No access records yet</p>
            <p className="text-muted-foreground text-sm">
              Create a grant after a buyer purchase.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length > 0 ? (
        <Card className="gap-0 overflow-hidden py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Buyer
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Status
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Tours
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Devices
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Access window
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-right text-xs font-semibold tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {records.map((record, rowIndex) => {
                  const pinLocked =
                    record.pinLockedUntil &&
                    new Date(record.pinLockedUntil) > new Date();
                  const isRevoking =
                    pendingAction?.id === record.id &&
                    pendingAction.type === "revoke";
                  const isDeleting =
                    pendingAction?.id === record.id &&
                    pendingAction.type === "delete";

                  return (
                    <tr
                      key={record.id}
                      className={cn(
                        "transition-colors hover:bg-brand-cream/35",
                        rowIndex % 2 === 1 && "bg-muted/15",
                      )}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="space-y-0.5">
                          <p className="text-foreground font-semibold tracking-tight">
                            {record.phone}
                          </p>
                          {record.email ? (
                            <p className="text-muted-foreground text-xs">
                              {record.email}
                            </p>
                          ) : null}
                          {record.notes ? (
                            <p className="text-muted-foreground line-clamp-2 max-w-[200px] text-xs italic">
                              {record.notes}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="flex flex-col items-center gap-1.5">
                          <AccessStatusBadge
                            effectiveStatus={record.effectiveStatus}
                            storedStatus={record.status}
                          />
                          {pinLocked ? (
                            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive uppercase">
                              <ShieldAlert className="size-3" />
                              PIN locked
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <TourChips tours={record.tours} />
                      </td>

                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="mx-auto w-fit">
                          <DeviceSeatMeter
                          active={record.activeDeviceCount}
                          max={record.maxDevices}
                        />
                        </div>
                      </td>

                      <td className="text-muted-foreground px-4 py-3.5 align-middle text-xs leading-relaxed">
                        {record.effectiveStatus === "PENDING" ? (
                          <p>
                            <span className="text-foreground font-medium">
                              Opens
                            </span>
                            <br />
                            {formatDate(record.activatedAt)}
                          </p>
                        ) : (
                          <p>
                            <span className="text-foreground font-medium">
                              Expires
                            </span>
                            <br />
                            {formatDate(record.expiresAt)}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-brand-tan/80 hover:bg-brand-cream/80"
                            nativeButton={false}
                            render={
                              <Link href={`/access/${record.id}/edit`} />
                            }
                            aria-label={`Edit access for ${record.phone}`}
                          >
                            <Pencil className="size-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          {record.status !== "REVOKED" ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-amber-500/30 text-amber-900 hover:bg-amber-500/10 dark:text-amber-100"
                              disabled={revokeAccess.isPending}
                              aria-label={`Revoke access for ${record.phone}`}
                              onClick={() =>
                                void handleRevoke(record.id, record.phone)
                              }
                            >
                              {isRevoking ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Ban className="size-4" />
                              )}
                              <span className="hidden sm:inline">Revoke</span>
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deleteAccess.isPending}
                            aria-label={`Delete access for ${record.phone}`}
                            onClick={() =>
                              void handleDelete(record.id, record.phone)
                            }
                          >
                            {isDeleting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-brand-tan/40 bg-brand-cream/25 px-4 py-2.5">
            <p className="text-muted-foreground text-xs">
              {records.length} grant{records.length === 1 ? "" : "s"} · scroll
              horizontally on smaller screens
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
