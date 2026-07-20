"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDeleteSubscriptionPlan } from "@/hooks/mutations/use-subscription-plan-mutations";
import { useSubscriptionPlans } from "@/hooks/queries/use-subscription-plans";
import { cn } from "@/lib/utils";

function formatPrice(basePrice: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(basePrice);
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

function DurationBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-950 ring-1 ring-sky-500/25 tabular-nums dark:text-sky-100">
      <CalendarDays className="size-3.5 shrink-0 opacity-80" />
      {days} day{days === 1 ? "" : "s"}
    </span>
  );
}

function PlansTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlansList() {
  const { data, isLoading, isError, error, refetch } = useSubscriptionPlans();
  const deletePlan = useDeleteSubscriptionPlan();
  const askConfirm = useConfirm();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const plans = [...(data?.data ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );

  async function handleDelete(id: string, name: string) {
    const confirmed = await askConfirm({
      title: `Delete plan "${name}"?`,
      description:
        "This is only possible if no purchase has ever used it.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(id);
    try {
      // The global mutation cache toasts the API's own message (e.g. "Plan is in
      // use by a purchase"), which the old window.alert lost by reading
      // err.message — that yields "Request failed with status code 409".
      await deletePlan.mutateAsync(id);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">
            Subscription plans
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Duration and base price shown to mobile users at checkout. Base
            price covers one device.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/subscriptions/plans/new" />}
        >
          <Plus className="size-4" />
          Add plan
        </Button>
      </div>

      {isLoading ? <PlansTableSkeleton /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load subscription plans</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && plans.length === 0 ? (
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Sparkles className="text-muted-foreground size-10" />
            <p className="font-medium">No subscription plans yet</p>
            <p className="text-muted-foreground text-sm">
              Add a plan (e.g. 1 Week, 1 Month) to enable self-service purchase
              in the app.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && plans.length > 0 ? (
        <Card className="gap-0 overflow-hidden py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Plan
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Duration
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Base price
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Order
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
                {plans.map((plan, rowIndex) => {
                  const isDeleting = pendingDeleteId === plan.id;

                  return (
                    <tr
                      key={plan.id}
                      className={cn(
                        "transition-colors hover:bg-brand-cream/35",
                        rowIndex % 2 === 1 && "bg-muted/15",
                      )}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-primary/20">
                            <Sparkles className="size-4" />
                          </div>
                          <p className="font-semibold tracking-tight">
                            {plan.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="flex justify-center">
                          <DurationBadge days={plan.durationInDays} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-950 ring-1 ring-violet-500/25 tabular-nums dark:text-violet-100">
                          <Wallet className="size-3.5 shrink-0 opacity-80" />
                          {formatPrice(plan.basePrice)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="bg-muted/80 text-foreground inline-flex min-w-8 justify-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ring-1 ring-border/60">
                          {plan.sortOrder}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="flex justify-center">
                          <StatusBadge isActive={plan.isActive} />
                        </div>
                      </td>
                      <td className="text-muted-foreground px-4 py-3.5 align-middle text-xs whitespace-nowrap">
                        {formatDate(plan.updatedAt)}
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
                                href={`/subscriptions/plans/${plan.id}/edit`}
                              />
                            }
                            aria-label={`Edit plan ${plan.name}`}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deletePlan.isPending}
                            aria-label={`Delete plan ${plan.name}`}
                            onClick={() => void handleDelete(plan.id, plan.name)}
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
              {plans.length} plan{plans.length === 1 ? "" : "s"} · sorted by
              display order
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
