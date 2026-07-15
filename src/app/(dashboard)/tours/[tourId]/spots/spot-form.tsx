"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormInput,
  FormQuill,
  FormSelect,
  FormTextarea,
} from "@/components/form";
import { AudienceTabs } from "@/components/i18n/audience-tabs";
import { LanguageTabs } from "@/components/i18n/language-tabs";
import {
  useCreateSpot,
  useUpdateSpot,
} from "@/hooks/mutations/use-spot-mutations";
import { useFloors } from "@/hooks/queries/use-floors";
import {
  AUDIENCE_TYPES,
  AUDIENCE_LABELS,
  DEFAULT_AUDIENCE,
  type AudienceType,
} from "@/lib/i18n/audiences";
import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  type AppLanguage,
} from "@/lib/i18n/languages";
import {
  emptyAudienceLanguageRecord,
  getPreferredAudienceTranslation,
} from "@/lib/i18n/translations";
import {
  spotFormSchema,
  type SpotFormInput,
} from "@/schemas/spot-form.schema";
import type { CreateSpotPayload, Spot } from "@/types/spot";

type SpotFormProps = {
  tourId: string;
  mode: "create" | "edit";
  defaultValues?: Spot;
};

function toFormValues(spot?: Spot, defaultFloorId = ""): SpotFormInput {
  return {
    floorId: spot?.floorId ?? defaultFloorId,
    sortOrder: spot?.sortOrder ?? 0,
    latitude: spot?.latitude?.toString() ?? "",
    longitude: spot?.longitude?.toString() ?? "",
    includedInQuickTour: spot?.includedInQuickTour ?? true,
    translations: emptyAudienceLanguageRecord((audience, language) => {
      const entry = spot?.translations.find(
        (translation) =>
          translation.language === language &&
          translation.audience === audience,
      );

      return {
        title: entry?.title ?? "",
        shortDesc: entry?.shortDesc ?? "",
        quill_html: entry?.quillJson?.html ?? entry?.descriptionHtml ?? "",
        quill_text: entry?.quillJson?.text ?? entry?.descriptionText ?? "",
      };
    }),
  };
}

function parseCoordinate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SpotForm({ tourId, mode, defaultValues }: SpotFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const createSpot = useCreateSpot(tourId);
  const updateSpot = useUpdateSpot(tourId);
  const { data: floorsResponse } = useFloors(tourId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeAudience, setActiveAudience] =
    useState<AudienceType>(DEFAULT_AUDIENCE);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);

  const floors = useMemo(
    () => floorsResponse?.data ?? [],
    [floorsResponse?.data],
  );
  const defaultFloorId = floors[0]?.id ?? "";

  const form = useForm<SpotFormInput>({
    resolver: zodResolver(spotFormSchema),
    defaultValues: toFormValues(defaultValues, defaultFloorId),
  });

  // Floors arrive after the first render, so a new spot's floor defaults once they land.
  useEffect(() => {
    if (!isEdit && !form.getValues("floorId") && defaultFloorId) {
      form.setValue("floorId", defaultFloorId);
    }
  }, [defaultFloorId, form, isEdit]);

  const floorOptions = floors.map((floor) => {
    const name = getPreferredAudienceTranslation(floor.translations)?.name;

    return {
      label: name ? `Floor ${floor.floorNo} — ${name}` : `Floor ${floor.floorNo}`,
      value: floor.id,
    };
  });

  async function handleSubmit(values: SpotFormInput) {
    setSubmitError(null);

    const payload: CreateSpotPayload = {
      floorId: values.floorId,
      sortOrder: values.sortOrder,
      latitude: parseCoordinate(values.latitude),
      longitude: parseCoordinate(values.longitude),
      includedInQuickTour: values.includedInQuickTour,
      translations: values.translations,
    };

    try {
      if (isEdit && defaultValues?.id) {
        await updateSpot.mutateAsync({
          spotId: defaultValues.id,
          payload,
        });
        router.push(`/tours/${tourId}/spots/${defaultValues.id}/media`);
      } else {
        const result = await createSpot.mutateAsync(payload);
        router.push(`/tours/${tourId}/spots/${result.data.id}/media`);
      }

      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save spot.",
      );
    }
  }

  const isSubmitting = form.formState.isSubmitting;
  const spotTitle = getPreferredAudienceTranslation(
    defaultValues?.translations ?? [],
  )?.title;

  return (
    <Form form={form} onSubmit={handleSubmit} className="space-y-6">
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? spotTitle ?? "Edit spot" : "New spot"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {floors.length === 0 ? (
            <Alert>
              <AlertDescription>
                This tour has no floors yet.{" "}
                <Link
                  href={`/tours/${tourId}/floors`}
                  className="font-medium underline"
                >
                  Create a floor
                </Link>{" "}
                before adding spots.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              name="floorId"
              label="Floor"
              options={floorOptions}
              disabled={isSubmitting || floors.length === 0}
              description={
                isEdit
                  ? "Changing this moves the spot to another floor."
                  : "The floor this spot sits on."
              }
            />
            <FormInput
              name="sortOrder"
              label="Order"
              type="number"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput name="latitude" label="Latitude" disabled={isSubmitting} />
            <FormInput name="longitude" label="Longitude" disabled={isSubmitting} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={isSubmitting}
              {...form.register("includedInQuickTour")}
            />
            Include this stop in the quick tour download
          </label>

          <AudienceTabs value={activeAudience} onChange={setActiveAudience} />
          <LanguageTabs value={activeLanguage} onChange={setActiveLanguage} />

          {AUDIENCE_TYPES.map((audience) =>
            APP_LANGUAGES.map((language) => (
              <div
                key={`${audience}-${language}`}
                className={
                  audience === activeAudience && language === activeLanguage
                    ? "space-y-4"
                    : "hidden"
                }
              >
                <p className="text-muted-foreground text-sm">
                  {AUDIENCE_LABELS[audience]} · {LANGUAGE_LABELS[language]}
                </p>
                <FormInput
                  name={`translations.${audience}.${language}.title`}
                  label="Title"
                  disabled={isSubmitting}
                />
                <FormTextarea
                  name={`translations.${audience}.${language}.shortDesc`}
                  label="Short description"
                  rows={2}
                  disabled={isSubmitting}
                />
                <FormQuill
                  htmlName={`translations.${audience}.${language}.quill_html`}
                  textName={`translations.${audience}.${language}.quill_text`}
                  label="Content"
                  disabled={isSubmitting}
                />
              </div>
            )),
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : isEdit ? (
            "Save spot"
          ) : (
            "Create spot"
          )}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/tours/${tourId}/spots`} />}
        >
          Back to spots
        </Button>
      </div>
    </Form>
  );
}
