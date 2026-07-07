"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptionPurchases } from "@/hooks/queries/use-subscription-purchases";
import type { SubscriptionPurchaseStatus } from "@/types/subscription-purchase";

function statusVariant(status: SubscriptionPurchaseStatus) {
  switch (status) {
    case "PAID":
      return "default" as const;
    case "PENDING":
      return "secondary" as const;
    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
      return "destructive" as const;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

export function PurchasesList() {
  const [email, setEmail] = useState("");
  const { data, isLoading, isError, error, refetch } = useSubscriptionPurchases(
    { page: 1, limit: 50, email: email.trim() || undefined },
  );

  const purchases = data?.data ?? [];

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">
            Self-service purchase history
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Read-only. Payment status is updated automatically by Stripe.
            Manage the resulting access from Access Mgmt if you need to
            intervene manually.
          </p>
        </div>
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Filter by buyer email"
          className="sm:w-64"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No purchases yet</p>
            <p className="text-muted-foreground text-sm">
              Self-service purchases made from the mobile app will show up
              here.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && purchases.length > 0 ? (
        <div className="grid gap-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="overflow-hidden">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(purchase.status)}>
                    {purchase.status}
                  </Badge>
                  <Badge variant="outline">{purchase.plan.name}</Badge>
                  <Badge variant="outline">
                    {purchase.deviceCount} device
                    {purchase.deviceCount === 1 ? "" : "s"}
                  </Badge>
                  <Badge variant="outline">
                    {formatAmount(purchase.totalAmount, purchase.currency)}
                  </Badge>
                </div>
                <CardTitle className="text-base">{purchase.email}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Created {formatDate(purchase.createdAt)}
                  {purchase.paidAt ? ` · Paid ${formatDate(purchase.paidAt)}` : ""}
                </p>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2">
                  {purchase.tours.map((tour) => (
                    <Badge key={tour.id} variant="secondary">
                      {tour.slug}
                    </Badge>
                  ))}
                </div>
                {purchase.failureReason ? (
                  <p className="text-destructive mt-3 text-sm">
                    {purchase.failureReason}
                  </p>
                ) : null}
              </CardContent>

              {purchase.tourAccessId ? (
                <CardFooter className="flex justify-end border-t bg-muted/30 px-4 py-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link href={`/access/${purchase.tourAccessId}/edit`} />
                    }
                  >
                    View access record
                  </Button>
                </CardFooter>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
