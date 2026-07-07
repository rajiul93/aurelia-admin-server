"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField, FormInput } from "@/components/form";
import {
  useCreateDevicePricingTier,
  useUpdateDevicePricingTier,
} from "@/hooks/mutations/use-device-pricing-tier-mutations";
import {
  devicePricingTierFormSchema,
  type DevicePricingTierFormInput,
} from "@/schemas/device-pricing-tier-form.schema";
import type { DevicePricingTier } from "@/types/device-pricing-tier";

type TierFormProps = {
  mode: "create" | "edit";
  defaultValues?: DevicePricingTier;
};

function toFormValues(tier?: DevicePricingTier): DevicePricingTierFormInput {
  return {
    deviceCount: tier?.deviceCount ?? 2,
    additionalPrice: tier?.additionalPrice ?? 0,
    isActive: tier?.isActive ?? true,
  };
}

export function TierForm({ mode, defaultValues }: TierFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createTier = useCreateDevicePricingTier();
  const updateTier = useUpdateDevicePricingTier();

  const form = useForm<DevicePricingTierFormInput>({
    resolver: zodResolver(devicePricingTierFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const isPending = createTier.isPending || updateTier.isPending;

  async function onSubmit(values: DevicePricingTierFormInput) {
    setSubmitError(null);

    try {
      if (mode === "edit" && defaultValues) {
        await updateTier.mutateAsync({ id: defaultValues.id, payload: values });
        router.push("/subscriptions/device-pricing");
        return;
      }

      await createTier.mutateAsync(values);
      router.push("/subscriptions/device-pricing");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save pricing tier.",
      );
    }
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-6">
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tier details</CardTitle>
          <CardDescription>
            Each extra device costs the same as the plan base price. For
            example, a €5/week plan with 2 devices is €10 before discount.
            Use tiers only if you want to document custom bundles — checkout
            always uses base price × device count.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            name="deviceCount"
            label="Total devices"
            type="number"
            min={2}
            max={500}
          />
          <FormInput
            name="additionalPrice"
            label="Additional price (EUR)"
            type="number"
            min={0}
            step="0.01"
          />
          <FormField name="isActive" label="Status">
            {(field) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                Active (available to the mobile app)
              </label>
            )}
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Create tier" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/subscriptions/device-pricing" />}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
