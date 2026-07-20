"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDeleteDevicePricingTier } from "@/hooks/mutations/use-device-pricing-tier-mutations";
import { useDevicePricingTiers } from "@/hooks/queries/use-device-pricing-tiers";
import { cn } from "@/lib/utils";

function formatPrice(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-emerald-900 uppercase ring-1 ring-emerald-500/25 dark:text-emerald-200">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/12 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-700 uppercase ring-1 ring-slate-400/25 dark:text-slate-300">
      <span className="size-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

function DeviceCountCell({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-primary/20">
        <Smartphone className="size-5" />
      </div>
      <div>
        <p className="text-foreground text-lg font-semibold tabular-nums tracking-tight">
          {count}
        </p>
        <p className="text-muted-foreground text-xs">
          device{count === 1 ? "" : "s"} total
        </p>
      </div>
    </div>
  );
}

function DeviceSeatDots({ count }: { count: number }) {
  const capped = Math.min(count, 8);

  return (
    <div className="flex flex-wrap gap-1" aria-hidden>
      {Array.from({ length: capped }).map((_, index) => (
        <span
          key={index}
          className="bg-linear-to-br from-primary to-brand-deep size-2 rounded-full ring-1 ring-primary/30"
        />
      ))}
      {count > 8 ? (
        <span className="text-muted-foreground text-[10px] font-medium">
          +{count - 8}
        </span>
      ) : null}
    </div>
  );
}

function TiersTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TiersList() {
  const { data, isLoading, isError, error, refetch } = useDevicePricingTiers();
  const deleteTier = useDeleteDevicePricingTier();
  const askConfirm = useConfirm();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const tiers = [...(data?.data ?? [])].sort(
    (a, b) => a.deviceCount - b.deviceCount,
  );

  async function handleDelete(id: string, deviceCount: number) {
    const confirmed = await askConfirm({
      title: `Delete the pricing tier for ${deviceCount} devices?`,
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(id);
    try {
      await deleteTier.mutateAsync(id);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">
            Device pricing tiers
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Device pricing is calculated automatically: each device costs the
            plan base price (e.g. €5 × 2 devices = €10). Tiers here are kept
            for reference only and do not change checkout totals.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/subscriptions/device-pricing/new" />}
        >
          <Plus className="size-4" />
          Add tier
        </Button>
      </div>

      {isLoading ? <TiersTableSkeleton /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load device pricing tiers</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && tiers.length === 0 ? (
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Wallet className="text-muted-foreground size-10" />
            <p className="font-medium">No device pricing tiers yet</p>
            <p className="text-muted-foreground text-sm">
              Without a tier, the mobile app can only offer 1 device per
              purchase.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && tiers.length > 0 ? (
        <Card className="gap-0 overflow-hidden py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Devices
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Seat map
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Add-on price
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Status
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Updated
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-right text-xs font-semibold tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {tiers.map((tier, rowIndex) => {
                  const isDeleting = pendingDeleteId === tier.id;

                  return (
                    <tr
                      key={tier.id}
                      className={cn(
                        "transition-colors hover:bg-brand-cream/35",
                        rowIndex % 2 === 1 && "bg-muted/15",
                      )}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <DeviceCountCell count={tier.deviceCount} />
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="flex justify-center">
                          <DeviceSeatDots count={tier.deviceCount} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-950 ring-1 ring-violet-500/25 tabular-nums dark:text-violet-100">
                          <Wallet className="size-3.5 shrink-0 opacity-80" />+
                          {formatPrice(tier.additionalPrice)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="flex justify-center">
                          <StatusBadge isActive={tier.isActive} />
                        </div>
                      </td>
                      <td className="text-muted-foreground px-4 py-3.5 align-middle text-xs whitespace-nowrap">
                        {formatDate(tier.updatedAt)}
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
                              <Link
                                href={`/subscriptions/device-pricing/${tier.id}/edit`}
                              />
                            }
                            aria-label={`Edit tier for ${tier.deviceCount} devices`}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deleteTier.isPending}
                            aria-label={`Delete tier for ${tier.deviceCount} devices`}
                            onClick={() =>
                              void handleDelete(tier.id, tier.deviceCount)
                            }
                          >
                            {isDeleting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete
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
              {tiers.length} tier{tiers.length === 1 ? "" : "s"} · sorted by
              device count
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
