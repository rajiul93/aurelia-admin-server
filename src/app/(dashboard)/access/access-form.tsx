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
    phone: access?.phone ?? "",
    // Write-only: an existing PIN is never sent to the browser, so the field
    // starts blank on edit and blank means "keep the current PIN".
    pin: "",
    email: access?.email ?? "",
    activatedAt: toDatetimeLocalValue(access?.activatedAt ?? new Date().toISOString()),
    expiresAt: toDatetimeLocalValue(access?.expiresAt),
    maxDevices: access?.maxDevices ?? 1,
    allowSubscriptionFeatures: access?.allowSubscriptionFeatures ?? false,
    notes: access?.notes ?? "",
    tours:
      access?.tours.map((tour) => ({
        tourId: tour.id,
        tourDate: tour.tourDate ?? "",
        startTime: tour.startTime ?? "",
      })) ?? [],
  };
}

/** Admins left to their own devices pick 1234. */
function randomPin() {
  return String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
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
  const selectedTours =
    useWatch({ control: form.control, name: "tours" }) ?? [];
  const isPending = createAccess.isPending || updateAccess.isPending;
  const isRevoked = defaultValues?.status === "REVOKED";
  const isLockedOut = Boolean(
    defaultValues?.pinLockedUntil &&
      new Date(defaultValues.pinLockedUntil) > new Date(),
  );

  function toggleTour(tourId: string) {
    const current = form.getValues("tours");
    const next = current.some((entry) => entry.tourId === tourId)
      ? current.filter((entry) => entry.tourId !== tourId)
      : [...current, { tourId, tourDate: "", startTime: "" }];

    form.setValue("tours", next, { shouldValidate: true });
  }

  function updateTourSchedule(
    tourId: string,
    field: "tourDate" | "startTime",
    value: string,
  ) {
    const next = form
      .getValues("tours")
      .map((entry) =>
        entry.tourId === tourId ? { ...entry, [field]: value } : entry,
      );

    form.setValue("tours", next, { shouldValidate: true });
  }

  async function onSubmit(values: TourAccessFormInput) {
    setSubmitError(null);

    if (mode === "create" && !values.pin) {
      form.setError("pin", { message: "Set a 4-digit PIN for the buyer" });
      return;
    }

    const payload = {
      phone: values.phone,
      email: values.email.trim() ? values.email.trim() : undefined,
      activatedAt: new Date(values.activatedAt).toISOString(),
      expiresAt: new Date(values.expiresAt).toISOString(),
      maxDevices: values.maxDevices,
      allowSubscriptionFeatures: values.allowSubscriptionFeatures,
      notes: values.notes.trim() ? values.notes.trim() : undefined,
      tours: values.tours.map((entry) => ({
        tourId: entry.tourId,
        // Empty inputs become null so the server clears any prior schedule.
        tourDate: entry.tourDate.trim() ? entry.tourDate.trim() : null,
        startTime: entry.startTime.trim() ? entry.startTime.trim() : null,
      })),
      // Only send a PIN when one was typed — otherwise the existing one stands.
      ...(values.pin ? { pin: values.pin } : {}),
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

      const result = await createAccess.mutateAsync({
        ...payload,
        pin: values.pin,
      });
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

      {isLockedOut ? (
        <Alert>
          <AlertDescription>
            This buyer is locked out after too many wrong PIN attempts until{" "}
            {new Date(defaultValues!.pinLockedUntil!).toLocaleString()}. Setting a
            new PIN below unlocks them immediately.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Buyer details</CardTitle>
          <CardDescription>
            The buyer unlocks the tour in the app with this phone number and PIN —
            send both to them yourself (SMS, WhatsApp, Messenger). Access works
            only between the activation and expiry dates.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormInput
            name="phone"
            label="Phone number"
            type="tel"
            placeholder="+880 1712 345678"
            disabled={isRevoked}
          />
          <FormField
            name="pin"
            label={mode === "create" ? "4-digit PIN" : "New PIN (optional)"}
          >
            {(field) => (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input
                    className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder={
                      mode === "create" ? "0417" : "Leave blank to keep current"
                    }
                    value={String(field.value ?? "")}
                    onChange={(event) =>
                      field.onChange(event.target.value.replace(/\D/g, ""))
                    }
                    disabled={isRevoked}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isRevoked}
                    onClick={() =>
                      form.setValue("pin", randomPin(), { shouldValidate: true })
                    }
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  {mode === "create"
                    ? "Write this down now — it is hashed on save and can never be read back."
                    : "Blank leaves the current PIN untouched. A new PIN also clears any lockout."}
                </p>
              </div>
            )}
          </FormField>
          <FormInput
            name="activatedAt"
            label="Activation date"
            type="datetime-local"
            disabled={isRevoked}
          />
          <FormInput
            name="expiresAt"
            label="Expiry date"
            type="datetime-local"
            disabled={isRevoked}
          />
          <FormInput
            name="maxDevices"
            label="Maximum devices"
            type="number"
            min={1}
            max={20}
            disabled={isRevoked}
          />
          <FormInput
            name="email"
            label="Email (optional)"
            type="email"
            placeholder="Only for Stripe receipts"
            disabled={isRevoked}
          />
          <FormField name="allowSubscriptionFeatures" label="Subscription features">
            {(field) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(field.value)}
                  onChange={(event) => field.onChange(event.target.checked)}
                  disabled={isRevoked}
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
              disabled={isRevoked}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allowed tours</CardTitle>
          <CardDescription>
            Select which tours this buyer can download. For each one, you can set
            an optional visit date and start time — the app uses them to remind
            the buyer to prepare (D-3 / D-2 / D-1). Leave them blank and the
            buyer sets their own date in the app.
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
            const selected = selectedTours.find(
              (entry) => entry.tourId === tour.id,
            );
            const checked = Boolean(selected);

            return (
              <div
                key={tour.id}
                className={cn(
                  "rounded-lg border p-3",
                  checked ? "border-primary/50 bg-primary/5" : "border-border",
                  isRevoked && "opacity-60",
                )}
              >
                <label
                  className={cn(
                    "flex items-start gap-3",
                    isRevoked ? "cursor-not-allowed" : "cursor-pointer",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isRevoked}
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

                {checked ? (
                  <div className="mt-3 grid gap-3 pl-7 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-muted-foreground block text-xs">
                        Visit date (optional)
                      </span>
                      <input
                        type="date"
                        value={selected?.tourDate ?? ""}
                        disabled={isRevoked}
                        onChange={(event) =>
                          updateTourSchedule(
                            tour.id,
                            "tourDate",
                            event.target.value,
                          )
                        }
                        className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-muted-foreground block text-xs">
                        Start time (optional)
                      </span>
                      <input
                        type="time"
                        value={selected?.startTime ?? ""}
                        disabled={isRevoked}
                        onChange={(event) =>
                          updateTourSchedule(
                            tour.id,
                            "startTime",
                            event.target.value,
                          )
                        }
                        className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}

          {form.formState.errors.tours ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.tours.message}
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
