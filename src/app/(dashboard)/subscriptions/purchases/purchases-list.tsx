"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  Mail,
  Receipt,
  Search,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptionPurchases } from "@/hooks/queries/use-subscription-purchases";
import { cn } from "@/lib/utils";
import type { SubscriptionPurchaseStatus } from "@/types/subscription-purchase";

function formatDateShort(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      date,
    ),
    time: new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(
      date,
    ),
  };
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

function statusPresentation(status: SubscriptionPurchaseStatus) {
  switch (status) {
    case "PAID":
      return {
        label: "Paid",
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
    case "FAILED":
      return {
        label: "Failed",
        dot: "bg-destructive",
        className:
          "bg-destructive/12 text-destructive ring-1 ring-destructive/25",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        dot: "bg-slate-400",
        className:
          "bg-slate-500/12 text-slate-700 ring-1 ring-slate-400/25 dark:text-slate-300",
      };
    case "REFUNDED":
      return {
        label: "Refunded",
        dot: "bg-violet-500",
        className:
          "bg-violet-500/12 text-violet-950 ring-1 ring-violet-500/30 dark:text-violet-200",
      };
  }
}

function PurchaseStatusBadge({ status }: { status: SubscriptionPurchaseStatus }) {
  const presentation = statusPresentation(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
        presentation.className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", presentation.dot)} />
      {presentation.label}
    </span>
  );
}

function TourChips({ tours }: { tours: { id: string; slug: string }[] }) {
  const visible = tours.slice(0, 2);
  const rest = tours.length - visible.length;

  return (
    <div className="flex max-w-[200px] flex-wrap gap-1">
      {visible.map((tour) => (
        <Badge
          key={tour.id}
          variant="outline"
          className="border-brand-tan/80 bg-brand-cream/50 text-brand-deep max-w-full truncate font-mono text-[10px] font-normal"
        >
          {tour.slug}
        </Badge>
      ))}
      {rest > 0 ? (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          +{rest}
        </Badge>
      ) : null}
    </div>
  );
}

function PurchasesTableSkeleton() {
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

export function PurchasesList() {
  const [email, setEmail] = useState("");
  const { data, isLoading, isError, error, refetch } = useSubscriptionPurchases(
    { page: 1, limit: 50, email: email.trim() || undefined },
  );

  const purchases = [...(data?.data ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="mt-8 space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-lg font-medium tracking-tight">
          Self-service purchase history
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Read-only. Payment status is updated automatically by Stripe. Manage
          the resulting access from Access Mgmt if you need to intervene
          manually.
        </p>
      </div>

      <Card className="gap-0 overflow-hidden border-brand-tan/60 py-0 shadow-sm ring-1 ring-border/70">
        <CardHeader className="border-b border-brand-tan/40 bg-linear-to-r from-brand/8 via-brand-cream/50 to-brand-tan/30 pb-4">
          <CardTitle className="text-brand-deep flex items-center gap-2 text-base">
            <Search className="size-4" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="max-w-md space-y-2">
            <Label htmlFor="purchase-email-filter">Buyer email</Label>
            <Input
              id="purchase-email-filter"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Filter by buyer email"
              className="border-brand-tan/70 focus-visible:ring-brand/30"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? <PurchasesTableSkeleton /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load purchases</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && purchases.length === 0 ? (
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Receipt className="text-muted-foreground size-10" />
            <p className="font-medium">No purchases yet</p>
            <p className="text-muted-foreground text-sm">
              Self-service purchases made from the mobile app will show up here.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && purchases.length > 0 ? (
        <Card className="gap-0 overflow-hidden py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Buyer
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Plan
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Total
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Devices
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Status
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Tours
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Timeline
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Access
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {purchases.map((purchase, rowIndex) => {
                  const created = formatDateShort(purchase.createdAt);
                  const paid = purchase.paidAt
                    ? formatDateShort(purchase.paidAt)
                    : null;

                  return (
                    <tr
                      key={purchase.id}
                      className={cn(
                        "transition-colors hover:bg-brand-cream/35",
                        rowIndex % 2 === 1 && "bg-muted/15",
                      )}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-start gap-2">
                          <Mail className="text-primary mt-0.5 size-4 shrink-0" />
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium break-all">
                              {purchase.email}
                            </p>
                            {purchase.failureReason ? (
                              <p className="text-destructive line-clamp-2 text-xs">
                                {purchase.failureReason}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-lg bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-950 ring-1 ring-sky-500/25 dark:text-sky-100">
                            {purchase.plan.name}
                          </span>
                          <p className="text-muted-foreground text-[10px] tabular-nums">
                            {purchase.plan.durationInDays} days
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-950 ring-1 ring-violet-500/25 tabular-nums dark:text-violet-100">
                          <Wallet className="size-3.5 shrink-0 opacity-80" />
                          {formatAmount(
                            purchase.totalAmount,
                            purchase.currency,
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="text-muted-foreground inline-flex items-center justify-center gap-1.5 text-xs font-medium tabular-nums">
                          <Smartphone className="text-primary size-3.5" />
                          {purchase.deviceCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="flex justify-center">
                          <PurchaseStatusBadge status={purchase.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <TourChips tours={purchase.tours} />
                      </td>
                      <td className="text-muted-foreground px-4 py-3.5 align-middle text-xs leading-relaxed whitespace-nowrap">
                        <div className="flex items-start gap-1.5">
                          <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
                          <div>
                            <p>
                              <span className="text-foreground font-medium">
                                Created
                              </span>
                              <br />
                              {created.date}
                              <br />
                              <span className="tabular-nums">{created.time}</span>
                            </p>
                            {paid ? (
                              <p className="mt-2">
                                <span className="text-emerald-800 font-medium dark:text-emerald-300">
                                  Paid
                                </span>
                                <br />
                                {paid.date}
                                <br />
                                <span className="tabular-nums">{paid.time}</span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        {purchase.tourAccessId ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-brand-tan/80 hover:bg-brand-cream/80"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/access/${purchase.tourAccessId}/edit`}
                              />
                            }
                          >
                            <ExternalLink className="size-4" />
                            View access
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-brand-tan/40 bg-brand-cream/25 px-4 py-2.5">
            <p className="text-muted-foreground text-xs">
              {purchases.length} purchase{purchases.length === 1 ? "" : "s"} ·
              newest first
              {email.trim() ? ` · filtered by “${email.trim()}”` : ""}
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
