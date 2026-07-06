"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormImageUpload, FormInput, FormMediaFileUpload } from "@/components/form";
import {
  useCreateSpotMedia,
  useDeleteSpotMedia,
} from "@/hooks/mutations/use-spot-mutations";
import { useSpot } from "@/hooks/queries/use-spots";
import { resolveMediaUpload } from "@/lib/media/client";
import {
  AUDIENCE_TYPES,
  AUDIENCE_LABELS,
  DEFAULT_AUDIENCE,
} from "@/lib/i18n/audiences";
import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  type AppLanguage,
} from "@/lib/i18n/languages";
import {
  spotMediaFormSchema,
  type SpotMediaFormInput,
} from "@/schemas/spot-form.schema";
import { defaultMediaFieldValue } from "@/types/media";
import type { AudienceType } from "@/lib/i18n/audiences";
import type { SpotMedia } from "@/types/spot";

const mediaTypeOptions = [
  { label: "Image", value: "IMAGE" },
  { label: "Video", value: "VIDEO" },
  { label: "Audio", value: "AUDIO" },
] as const;

type MediaType = (typeof mediaTypeOptions)[number]["value"];

function getSubmitErrorMessage(error: unknown) {
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

  return "Unable to add media.";
}

function nextSortOrder(
  existing: SpotMedia[],
  audience: AudienceType,
  language: AppLanguage,
) {
  const matching = existing.filter(
    (item) =>
      item.audience === audience &&
      item.language === language,
  );

  if (matching.length === 0) {
    return 0;
  }

  return Math.max(...matching.map((item) => item.sortOrder)) + 1;
}

export default function SpotMediaPage() {
  const params = useParams<{ tourId: string; spotId: string }>();
  const { data, isLoading } = useSpot(params.tourId, params.spotId);
  const createMedia = useCreateSpotMedia(params.tourId, params.spotId);
  const deleteMedia = useDeleteSpotMedia(params.tourId, params.spotId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [viewAudience, setViewAudience] = useState<AudienceType>(DEFAULT_AUDIENCE);
  const [viewLanguage, setViewLanguage] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  const form = useForm<SpotMediaFormInput>({
    resolver: zodResolver(spotMediaFormSchema),
    defaultValues: {
      type: "IMAGE",
      language: DEFAULT_LANGUAGE,
      audience: DEFAULT_AUDIENCE,
      includedInQuickTour: true,
      sortOrder: 0,
      media: defaultMediaFieldValue,
      thumbnail: defaultMediaFieldValue,
    },
  });

  const spot = data?.data;
  const isSubmitting = form.formState.isSubmitting;
  const mediaType = form.watch("type");
  const formAudience = form.watch("audience");
  const formLanguage = form.watch("language");

  const filteredMedias = useMemo(() => {
    return (
      spot?.medias.filter(
        (media) =>
          media.audience === viewAudience && media.language === viewLanguage,
      ) ?? []
    );
  }, [spot?.medias, viewAudience, viewLanguage]);

  function setMediaType(nextType: MediaType) {
    form.setValue("type", nextType);
    form.setValue("media", defaultMediaFieldValue);
    form.setValue("thumbnail", defaultMediaFieldValue);
    form.clearErrors(["media", "thumbnail"]);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  useEffect(() => {
    if (!spot) {
      return;
    }

    form.setValue(
      "sortOrder",
      nextSortOrder(spot.medias, formAudience, formLanguage),
    );
  }, [form, formAudience, formLanguage, spot?.medias]);

  async function handleSubmit(values: SpotMediaFormInput) {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const mediaId = await resolveMediaUpload(values.media);
      const thumbnailMediaId =
        values.type === "IMAGE"
          ? null
          : await resolveMediaUpload(values.thumbnail);

      if (!mediaId) {
        form.setError("media", { message: "Media file is required" });
        return;
      }

      await createMedia.mutateAsync({
        type: values.type,
        sortOrder: values.sortOrder,
        mediaId,
        thumbnailMediaId: thumbnailMediaId ?? null,
        language: values.language,
        audience: values.audience,
        includedInQuickTour: values.includedInQuickTour,
      });

      setViewAudience(values.audience);
      setViewLanguage(values.language);

      const nextOrder = values.sortOrder + 1;

      form.reset({
        type: values.type,
        language: values.language,
        audience: values.audience,
        includedInQuickTour: values.includedInQuickTour,
        sortOrder: nextOrder,
        media: defaultMediaFieldValue,
        thumbnail: defaultMediaFieldValue,
      });
      form.clearErrors();
      setSubmitSuccess(
        `Media added for ${AUDIENCE_LABELS[values.audience]} · ${LANGUAGE_LABELS[values.language]}. Upload another file or switch audience/language.`,
      );
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error));
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link href={`/tours/${params.tourId}/spots`} className="hover:underline">
            Back to spots
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Spot media</h1>
        <p className="text-muted-foreground text-sm">
          Upload images, audio, and video separately for each audience and
          language. The mobile app only downloads media matching the visitor&apos;s
          choices at download time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add media</CardTitle>
          <CardDescription>
            Choose audience, language, and media type. Each combination keeps its
            own files — e.g. Adults · English audio is separate from Children ·
            Spanish audio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Audience</Label>
                <select
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  disabled={isSubmitting}
                  {...form.register("audience")}
                >
                  {AUDIENCE_TYPES.map((audience) => (
                    <option key={audience} value={audience}>
                      {AUDIENCE_LABELS[audience]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <select
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  disabled={isSubmitting}
                  {...form.register("language")}
                >
                  {APP_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {LANGUAGE_LABELS[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Media type</Label>
                <div className="flex flex-wrap gap-2">
                  {mediaTypeOptions.map((option) => {
                    const active = mediaType === option.value;

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        disabled={isSubmitting}
                        onClick={() => setMediaType(option.value)}
                      >
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-xs">
                  {mediaType === "IMAGE"
                    ? "Upload a photo for this stop."
                    : mediaType === "VIDEO"
                      ? "Upload MP4, WebM, or MOV up to 100 MB."
                      : "Upload MP3, M4A, WAV, OGG, or WebM up to 100 MB."}
                </p>
              </div>
              <FormInput
                name="sortOrder"
                label="Order"
                type="number"
                disabled={isSubmitting}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={isSubmitting}
                {...form.register("includedInQuickTour")}
              />
              Include in quick tour
            </label>

            {mediaType === "IMAGE" ? (
              <FormImageUpload
                name="media"
                label="Image file"
                description="One image per submit."
                disabled={isSubmitting}
              />
            ) : (
              <>
                <FormMediaFileUpload
                  name="media"
                  kind={mediaType === "VIDEO" ? "video" : "audio"}
                  label={mediaType === "VIDEO" ? "Video file" : "Audio file"}
                  disabled={isSubmitting}
                />
                <FormImageUpload
                  name="thumbnail"
                  label="Thumbnail (optional)"
                  description="Preview image for this video or audio item."
                  disabled={isSubmitting}
                />
              </>
            )}

            {submitError ? (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            {submitSuccess ? (
              <Alert>
                <AlertDescription>{submitSuccess}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Add media"
              )}
            </Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uploaded media</CardTitle>
          <CardDescription>
            Filter by audience and language to review what visitors will receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>View audience</Label>
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={viewAudience}
                onChange={(event) =>
                  setViewAudience(event.target.value as AudienceType)
                }
              >
                {AUDIENCE_TYPES.map((audience) => (
                  <option key={audience} value={audience}>
                    {AUDIENCE_LABELS[audience]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>View language</Label>
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={viewLanguage}
                onChange={(event) =>
                  setViewLanguage(event.target.value as AppLanguage)
                }
              >
                {APP_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {LANGUAGE_LABELS[language]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? null : filteredMedias.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No media for {AUDIENCE_LABELS[viewAudience]} ·{" "}
              {LANGUAGE_LABELS[viewLanguage]} yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredMedias.map((media) => (
                <Card key={media.id}>
                  <CardContent className="space-y-3 pt-6">
                    {media.type === "IMAGE" || media.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={media.thumbnail ?? media.url}
                        alt={media.type}
                        className="aspect-video w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium">{media.type} file</p>
                        {media.media.originalName ? (
                          <p className="text-muted-foreground text-xs break-all">
                            {media.media.originalName}
                          </p>
                        ) : null}
                        <a
                          href={media.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-xs underline"
                        >
                          Open file
                        </a>
                      </div>
                    )}
                    <p className="text-sm font-medium">
                      {media.type} · {AUDIENCE_LABELS[media.audience]} ·{" "}
                      {LANGUAGE_LABELS[media.language]} · order {media.sortOrder}
                    </p>
                    {media.includedInQuickTour ? (
                      <p className="text-muted-foreground text-xs">
                        Included in quick tour
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        Full tour only
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => void deleteMedia.mutateAsync(media.id)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
