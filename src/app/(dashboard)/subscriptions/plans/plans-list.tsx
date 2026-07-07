"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteSubscriptionPlan } from "@/hooks/mutations/use-subscription-plan-mutations";
import { useSubscriptionPlans } from "@/hooks/queries/use-subscription-plans";

function formatPrice(basePrice: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(basePrice);
}

export function PlansList() {
  const { data, isLoading, isError, error, refetch } = useSubscriptionPlans();
  const deletePlan = useDeleteSubscriptionPlan();

  const plans = data?.data ?? [];

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete plan "${name}"? This is only possible if no purchase has ever used it.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePlan.mutateAsync(id);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Could not delete plan.",
      );
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
        <Button nativeButton={false} render={<Link href="/subscriptions/plans/new" />}>
          <Plus className="size-4" />
          Add plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No subscription plans yet</p>
            <p className="text-muted-foreground text-sm">
              Add a plan (e.g. 1 Week, 1 Month) to enable self-service purchase in the app.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && plans.length > 0 ? (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{plan.durationInDays} days</Badge>
                  <Badge variant="outline">{formatPrice(plan.basePrice)}</Badge>
                </div>
                <CardTitle className="text-base">{plan.name}</CardTitle>
              </CardHeader>

              <CardFooter className="flex flex-wrap justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/subscriptions/plans/${plan.id}/edit`} />}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deletePlan.isPending}
                  onClick={() => void handleDelete(plan.id, plan.name)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
