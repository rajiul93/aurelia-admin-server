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
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
} from "@/hooks/mutations/use-subscription-plan-mutations";
import {
  subscriptionPlanFormSchema,
  type SubscriptionPlanFormInput,
} from "@/schemas/subscription-plan-form.schema";
import type { SubscriptionPlan } from "@/types/subscription-plan";

type PlanFormProps = {
  mode: "create" | "edit";
  defaultValues?: SubscriptionPlan;
};

function toFormValues(plan?: SubscriptionPlan): SubscriptionPlanFormInput {
  return {
    name: plan?.name ?? "",
    durationInDays: plan?.durationInDays ?? 7,
    basePrice: plan?.basePrice ?? 0,
    isActive: plan?.isActive ?? true,
    sortOrder: plan?.sortOrder ?? 0,
  };
}

export function PlanForm({ mode, defaultValues }: PlanFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();

  const form = useForm<SubscriptionPlanFormInput>({
    resolver: zodResolver(subscriptionPlanFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const isPending = createPlan.isPending || updatePlan.isPending;

  async function onSubmit(values: SubscriptionPlanFormInput) {
    setSubmitError(null);

    try {
      if (mode === "edit" && defaultValues) {
        await updatePlan.mutateAsync({ id: defaultValues.id, payload: values });
        router.push("/subscriptions/plans");
        return;
      }

      await createPlan.mutateAsync(values);
      router.push("/subscriptions/plans");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save plan.",
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
          <CardTitle>Plan details</CardTitle>
          <CardDescription>
            Shown to mobile users at checkout. Base price covers a single
            device — extra devices are priced separately under Device
            Pricing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput name="name" label="Name" placeholder="1 Month" />
          <FormInput
            name="durationInDays"
            label="Duration (days)"
            type="number"
            min={1}
            max={3650}
          />
          <FormInput
            name="basePrice"
            label="Base price (EUR)"
            type="number"
            min={0}
            step="0.01"
          />
          <FormInput
            name="sortOrder"
            label="Sort order"
            type="number"
            min={0}
          />
          <FormField name="isActive" label="Status">
            {(field) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
                Active (visible to the mobile app)
              </label>
            )}
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Create plan" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/subscriptions/plans" />}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
