"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDevicePricingTier } from "@/hooks/queries/use-device-pricing-tiers";
import { TierForm } from "../../tier-form";

export default function EditDevicePricingTierPage() {
  const params = useParams<{ id: string }>();
  const tierId = params.id;

  const { data, isLoading, isError, error } = useDevicePricingTier(tierId);
  const tier = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !tier) {
    return (
      <div className="space-y-4">
        <p className="font-medium">Could not load pricing tier</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Tier not found."}
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/subscriptions/device-pricing" />}
        >
          Back to device pricing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Device Pricing Tier</h1>
        <p className="text-muted-foreground text-sm">
          Update pricing for {tier.deviceCount} devices.
        </p>
      </div>
      <TierForm mode="edit" defaultValues={tier} />
    </div>
  );
}
