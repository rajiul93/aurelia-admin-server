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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDeleteDevicePricingTier } from "@/hooks/mutations/use-device-pricing-tier-mutations";
import { useDevicePricingTiers } from "@/hooks/queries/use-device-pricing-tiers";

function formatPrice(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function TiersList() {
  const { data, isLoading, isError, error, refetch } = useDevicePricingTiers();
  const deleteTier = useDeleteDevicePricingTier();
  const askConfirm = useConfirm();

  const tiers = data?.data ?? [];

  async function handleDelete(id: string, deviceCount: number) {
    const confirmed = await askConfirm({
      title: `Delete the pricing tier for ${deviceCount} devices?`,
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    await deleteTier.mutateAsync(id);
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

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No device pricing tiers yet</p>
            <p className="text-muted-foreground text-sm">
              Without a tier, the mobile app can only offer 1 device per
              purchase.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && tiers.length > 0 ? (
        <div className="grid gap-4">
          {tiers.map((tier) => (
            <Card key={tier.id} className="overflow-hidden">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={tier.isActive ? "default" : "secondary"}>
                    {tier.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">
                    +{formatPrice(tier.additionalPrice)}
                  </Badge>
                </div>
                <CardTitle className="text-base">
                  {tier.deviceCount} devices total
                </CardTitle>
              </CardHeader>

              <CardFooter className="flex flex-wrap justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link href={`/subscriptions/device-pricing/${tier.id}/edit`} />
                  }
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteTier.isPending}
                  onClick={() => void handleDelete(tier.id, tier.deviceCount)}
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
