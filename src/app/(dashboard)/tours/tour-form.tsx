"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import {
  Form,
  FormImageUpload,
  FormInput,
  FormTextarea,
} from "@/components/form";
import { AudienceTabs } from "@/components/i18n/audience-tabs";
import { LanguageTabs } from "@/components/i18n/language-tabs";
import {
  useCreateTour,
  useUpdateTour,
} from "@/hooks/mutations/use-tour-mutations";
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
import { emptyAudienceLanguageRecord } from "@/lib/i18n/translations";
import { resolveMediaUpload } from "@/lib/media/client";
import { slugify } from "@/lib/slug";
import {
  tourFormSchema,
  type TourFormInput,
} from "@/schemas/tour-form.schema";
import type { CreateTourPayload, TourDetail } from "@/types/tour";
import { defaultMediaFieldValue } from "@/types/media";

type TourFormProps = {
  mode: "create" | "edit";
  defaultValues?: TourDetail;
};

function toFormValues(tour?: TourDetail): TourFormInput {
  return {
    cover: defaultMediaFieldValue,
    slug: tour?.slug ?? "",
    translations: emptyAudienceLanguageRecord((audience, language) => {
      const entry = tour?.translations.find(
        (translation) =>
          translation.language === language &&
          translation.audience === audience,
      );

      return {
        title: entry?.title ?? "",
        description: entry?.description ?? "",
        slug: entry?.slug ?? "",
      };
    }),
  };
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof error.response.data.error === "object" &&
    error.response.data.error !== null &&
    "message" in error.response.data.error &&
    typeof error.response.data.error.message === "string"
  ) {
    return error.response.data.error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to save tour.";
}

export function TourForm({ mode, defaultValues }: TourFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeAudience, setActiveAudience] =
    useState<AudienceType>(DEFAULT_AUDIENCE);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<TourFormInput>({
    resolver: zodResolver(tourFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  async function handleSubmit(values: TourFormInput) {
    setSubmitError(null);

    try {
      const coverMediaId = await resolveMediaUpload(
        values.cover,
        defaultValues?.coverMediaId,
        { onProgress: setUploadProgress },
      );

      if (!coverMediaId) {
        throw new Error("Cover image is required");
      }

      const payload: CreateTourPayload = {
        slug:
          slugify(values.slug) ||
          slugify(values.translations.ADULTS.en.title) ||
          slugify(values.translations.ADULTS.en.slug),
        coverMediaId,
        translations: values.translations,
      };

      if (isEdit && defaultValues?.id) {
        await updateTour.mutateAsync({ id: defaultValues.id, payload });
        router.push(`/tours/${defaultValues.id}/spots`);
      } else {
        const result = await createTour.mutateAsync(payload);
        router.push(`/tours/${result.data.id}/spots`);
      }

      router.refresh();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setUploadProgress(null);
    }
  }

  const isSubmitting = form.formState.isSubmitting;
  const tourId = defaultValues?.id;

  return (
    <Form form={form} onSubmit={handleSubmit} className="space-y-6">
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tour details</CardTitle>
          <CardDescription>
            Catalog metadata only. Manage spots, media, and FAQs separately
            after saving this tour.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormInput
            name="slug"
            label="Tour slug"
            placeholder="colosseum-night-tour"
            disabled={isSubmitting}
            description="Leave blank to generate from the English title. New tours start as Draft."
          />

          <FormImageUpload
            name="cover"
            label="Cover image"
            description="Required. Used in the mobile catalog."
            existingMedia={defaultValues?.coverMedia ?? undefined}
            isUploading={isSubmitting && uploadProgress !== null}
            uploadProgress={uploadProgress ?? undefined}
            disabled={isSubmitting}
          />

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
                  name={`translations.${audience}.${language}.description`}
                  label="Description"
                  rows={3}
                  disabled={isSubmitting}
                />
                <FormInput
                  name={`translations.${audience}.${language}.slug`}
                  label="URL slug"
                  disabled={isSubmitting}
                />
              </div>
            )),
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : isEdit ? (
            "Save tour"
          ) : (
            "Create tour"
          )}
        </Button>
        {isEdit && tourId ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/tours/${tourId}/spots`} />}
          >
            Manage spots
          </Button>
        ) : null}
        <Button variant="outline" nativeButton={false} render={<Link href="/tours" />}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
