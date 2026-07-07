"use client";

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormField, FormInput } from "@/components/form";
import { useUpdateSubscriptionPricingSettings } from "@/hooks/mutations/use-subscription-pricing-settings-mutations";
import { useSubscriptionPricingSettings } from "@/hooks/queries/use-subscription-pricing-settings";
import {
  subscriptionPricingSettingsFormSchema,
  type SubscriptionPricingSettingsFormInput,
} from "@/schemas/subscription-pricing-settings-form.schema";
import type { SubscriptionPricingSettings } from "@/types/subscription-pricing-settings";

function toFormValues(
  settings?: SubscriptionPricingSettings,
): SubscriptionPricingSettingsFormInput {
  return {
    currency: settings?.currency ?? "EUR",
    multiDeviceDiscountEnabled: settings?.multiDeviceDiscountEnabled ?? true,
    multiDeviceDiscountPercent: settings?.multiDeviceDiscountPercent ?? 10,
    maxDevicesPerPurchase: settings?.maxDevicesPerPurchase ?? 10,
  };
}

export function SettingsForm() {
  const { data, isLoading, isError, error } = useSubscriptionPricingSettings();
  const updateSettings = useUpdateSubscriptionPricingSettings();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const settings = data?.data;

  const form = useForm<SubscriptionPricingSettingsFormInput>({
    resolver: zodResolver(subscriptionPricingSettingsFormSchema),
    defaultValues: toFormValues(settings),
  });

  useEffect(() => {
    if (settings) {
      form.reset(toFormValues(settings));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function onSubmit(values: SubscriptionPricingSettingsFormInput) {
    setSubmitError(null);
    setSavedAt(null);

    try {
      await updateSettings.mutateAsync(values);
      setSavedAt(Date.now());
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not save settings.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Could not load pricing settings."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Form form={form} onSubmit={onSubmit} className="space-y-6">
        {submitError ? (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        {savedAt ? (
          <Alert>
            <AlertDescription>Settings saved.</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Multi-device discount</CardTitle>
            <CardDescription>
              When a user selects more than one device, this discount applies
              only to the additional-device charge — never to the plan&apos;s
              base price.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              name="multiDeviceDiscountEnabled"
              label="Discount"
            >
              {(field) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Enable multi-device discount
                </label>
              )}
            </FormField>
            <FormInput
              name="multiDeviceDiscountPercent"
              label="Discount percent"
              type="number"
              min={0}
              max={100}
              step="0.01"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase limits</CardTitle>
            <CardDescription>
              Currency used across all plans and device pricing tiers, and the
              maximum number of devices a single purchase can cover.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="currency"
              label="Currency code"
              placeholder="EUR"
              maxLength={3}
            />
            <FormInput
              name="maxDevicesPerPurchase"
              label="Max devices per purchase"
              type="number"
              min={1}
              max={500}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Save settings
        </Button>
      </Form>
    </div>
  );
}
