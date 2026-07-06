"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField, FormInput, FormTextarea } from "@/components/form";
import {
  useCreateTourAccess,
  useUpdateTourAccess,
} from "@/hooks/mutations/use-tour-access-mutations";
import { useTours } from "@/hooks/queries/use-tours";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import {
  tourAccessFormSchema,
  type TourAccessFormInput,
} from "@/schemas/tour-access-form.schema";
import type { TourAccess } from "@/types/tour-access";

type TourAccessFormProps = {
  mode: "create" | "edit";
  defaultValues?: TourAccess;
};

function toDatetimeLocalValue(iso?: string) {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toFormValues(access?: TourAccess): TourAccessFormInput {
  return {
    email: access?.email ?? "",
    expiresAt: toDatetimeLocalValue(access?.expiresAt),
    ticketCount: access?.ticketCount ?? 1,
    allowSubscriptionFeatures: access?.allowSubscriptionFeatures ?? false,
    notes: access?.notes ?? "",
    tourIds: access?.tours.map((tour) => tour.id) ?? [],
  };
}

export function TourAccessForm({ mode, defaultValues }: TourAccessFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createAccess = useCreateTourAccess();
  const updateAccess = useUpdateTourAccess();
  const { data: toursData, isLoading: toursLoading } = useTours({
    page: 1,
    limit: 100,
  });

  const form = useForm<TourAccessFormInput>({
    resolver: zodResolver(tourAccessFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const tours = toursData?.data ?? [];
  const selectedTourIds =
    useWatch({ control: form.control, name: "tourIds" }) ?? [];
  const isPending = createAccess.isPending || updateAccess.isPending;

  function toggleTour(tourId: string) {
    const current = form.getValues("tourIds");
    const next = current.includes(tourId)
      ? current.filter((id) => id !== tourId)
      : [...current, tourId];

    form.setValue("tourIds", next, { shouldValidate: true });
  }

  async function onSubmit(values: TourAccessFormInput) {
    setSubmitError(null);

    const payload = {
      email: values.email,
      expiresAt: new Date(values.expiresAt).toISOString(),
      ticketCount: values.ticketCount,
      allowSubscriptionFeatures: values.allowSubscriptionFeatures,
      notes: values.notes.trim() ? values.notes.trim() : undefined,
      tourIds: values.tourIds,
    };

    try {
      if (mode === "edit" && defaultValues) {
        await updateAccess.mutateAsync({
          id: defaultValues.id,
          payload,
        });
        router.push("/access");
        return;
      }

      const result = await createAccess.mutateAsync(payload);
      router.push(`/access/${result.data.id}/edit`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save access record.",
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
          <CardTitle>Buyer details</CardTitle>
          <CardDescription>
            Website buyers sign in with this email and OTP. Access expires on the
            selected date.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            name="email"
            label="Email"
            type="email"
            placeholder="buyer@example.com"
            disabled={mode === "edit" && defaultValues?.status === "REVOKED"}
          />
          <FormInput
            name="expiresAt"
            label="Expires at"
            type="datetime-local"
            disabled={defaultValues?.status === "REVOKED"}
          />
          <FormInput
            name="ticketCount"
            label="Device seats"
            type="number"
            min={1}
            max={20}
            disabled={defaultValues?.status === "REVOKED"}
          />
          <FormField name="allowSubscriptionFeatures" label="Subscription features">
            {(field) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(event) => field.onChange(event.target.checked)}
                  disabled={defaultValues?.status === "REVOKED"}
                />
                Allow subscription-style features
              </label>
            )}
          </FormField>
          <div className="sm:col-span-2">
            <FormTextarea
              name="notes"
              label="Notes"
              placeholder="Purchase reference, support notes, etc."
              rows={3}
              disabled={defaultValues?.status === "REVOKED"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allowed tours</CardTitle>
          <CardDescription>
            Select which tours this buyer can download after OTP sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {toursLoading ? (
            <p className="text-muted-foreground text-sm">Loading tours...</p>
          ) : null}

          {!toursLoading && tours.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No tours available. Create a tour first.
            </p>
          ) : null}

          {tours.map((tour) => {
            const preferred = getPreferredTranslation(tour.translations);
            const checked = selectedTourIds.includes(tour.id);

            return (
              <label
                key={tour.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                  checked ? "border-primary/50 bg-primary/5" : "border-border",
                  defaultValues?.status === "REVOKED" &&
                    "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={defaultValues?.status === "REVOKED"}
                  onChange={() => toggleTour(tour.id)}
                  className="mt-1"
                />
                <span className="space-y-1">
                  <span className="block font-medium">
                    {preferred?.title ?? tour.slug}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {tour.slug}
                  </span>
                </span>
              </label>
            );
          })}

          {form.formState.errors.tourIds ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.tourIds.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || defaultValues?.status === "REVOKED"}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Create access" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href="/access" />}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
