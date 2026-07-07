"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptionPlan } from "@/hooks/queries/use-subscription-plans";
import { PlanForm } from "../../plan-form";

export default function EditSubscriptionPlanPage() {
  const params = useParams<{ id: string }>();
  const planId = params.id;

  const { data, isLoading, isError, error } = useSubscriptionPlan(planId);
  const plan = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="space-y-4">
        <p className="font-medium">Could not load plan</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Plan not found."}
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/subscriptions/plans" />}
        >
          Back to plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Plan</h1>
        <p className="text-muted-foreground text-sm">Update {plan.name}.</p>
      </div>
      <PlanForm mode="edit" defaultValues={plan} />
    </div>
  );
}
