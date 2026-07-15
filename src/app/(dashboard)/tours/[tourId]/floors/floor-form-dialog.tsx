"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, SquarePen } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormImageUpload, FormInput } from "@/components/form";
import { AudienceTabs } from "@/components/i18n/audience-tabs";
import { LanguageTabs } from "@/components/i18n/language-tabs";
import {
  useCreateFloor,
  useUpdateFloor,
} from "@/hooks/mutations/use-floor-mutations";
import {
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
import {
  floorFormSchema,
  type FloorFormInput,
} from "@/schemas/floor-form.schema";
import type { Floor } from "@/types/floor";
import { defaultMediaFieldValue } from "@/types/media";
import { getApiErrorMessage } from "@/lib/api/error-message";

type FloorFormDialogProps = {
  tourId: string;
  mode: "create" | "edit";
  floor?: Floor;
  nextFloorNo?: number;
};

function toFormValues(floor?: Floor, nextFloorNo = 1): FloorFormInput {
  return {
    floorNo: floor?.floorNo ?? nextFloorNo,
    mapTileUrl: floor?.mapTileUrl ?? "",
    cover: defaultMediaFieldValue,
    sortOrder: floor?.sortOrder ?? 0,
    translations: emptyAudienceLanguageRecord((audience, language) => {
      const entry = floor?.translations.find(
        (translation) =>
          translation.language === language &&
          translation.audience === audience,
      );

      return { name: entry?.name ?? "" };
    }),
  };
}

export function FloorFormDialog({
  tourId,
  mode,
  floor,
  nextFloorNo = 1,
}: FloorFormDialogProps) {
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeAudience, setActiveAudience] =
    useState<AudienceType>(DEFAULT_AUDIENCE);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const createFloor = useCreateFloor(tourId);
  const updateFloor = useUpdateFloor(tourId);
  const isPending = createFloor.isPending || updateFloor.isPending;

  const form = useForm<FloorFormInput>({
    resolver: zodResolver(floorFormSchema),
    defaultValues: toFormValues(floor, nextFloorNo),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setSubmitError(null);
      setActiveAudience(DEFAULT_AUDIENCE);
      setActiveLanguage(DEFAULT_LANGUAGE);
      form.reset(toFormValues(floor, nextFloorNo));
    }
  }

  async function onSubmit(values: FloorFormInput) {
    setSubmitError(null);

    try {
      const coverMediaId =
        (await resolveMediaUpload(values.cover, floor?.coverMediaId, {
          onProgress: setUploadProgress,
        })) ?? null;

      const payload = {
        floorNo: values.floorNo,
        mapTileUrl: values.mapTileUrl.trim() || null,
        coverMediaId,
        sortOrder: values.sortOrder,
        translations: emptyAudienceLanguageRecord((audience, language) => ({
          name: values.translations[audience][language].name,
        })),
      };

      if (isEdit && floor) {
        await updateFloor.mutateAsync({ floorId: floor.id, payload });
      } else {
        await createFloor.mutateAsync(payload);
      }

      setOpen(false);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Could not save floor."));
    } finally {
      setUploadProgress(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant={isEdit ? "ghost" : "default"}
            size="sm"
            className={isEdit ? undefined : undefined}
          />
        }
      >
        {isEdit ? (
          <>
            <SquarePen className="size-4" />
            Edit
          </>
        ) : (
          <>
            <Plus className="size-4" />
            Add Floor
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit floor" : "Add floor"}</DialogTitle>
          <DialogDescription>
            Each floor carries its own map, spots, and route. The floor name is
            what visitors see in the app&apos;s floor switcher.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit} className="space-y-5">
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="floorNo"
              label="Floor number"
              type="number"
              description="Unique per tour. Use 0 for a ground floor."
              disabled={isPending}
            />
            <FormInput
              name="sortOrder"
              label="Display order"
              type="number"
              min={0}
              disabled={isPending}
            />
          </div>

          <FormInput
            name="mapTileUrl"
            label="Map tile URL"
            placeholder="https://tiles.example.com/floor1/{z}/{x}/{y}.pbf"
            description="Optional. The offline map served for this floor."
            disabled={isPending}
          />

          <FormImageUpload
            name="cover"
            label="Cover image"
            description="Optional. Shown on the floor card in the app. Uploads when you save."
            existingMedia={floor?.coverMedia}
            isUploading={isPending && uploadProgress !== null}
            uploadProgress={uploadProgress ?? undefined}
            disabled={isPending}
          />

          <div className="space-y-4">
            <AudienceTabs value={activeAudience} onChange={setActiveAudience} />
            <LanguageTabs value={activeLanguage} onChange={setActiveLanguage} />
            <p className="text-muted-foreground text-sm font-medium">
              {AUDIENCE_LABELS[activeAudience]} ·{" "}
              {LANGUAGE_LABELS[activeLanguage]}
            </p>

            {APP_LANGUAGES.map((language) => (
              <div
                key={language}
                className={language === activeLanguage ? "" : "hidden"}
              >
                <FormInput
                  name={`translations.${activeAudience}.${language}.name`}
                  label="Floor name"
                  placeholder="Ground Floor"
                  disabled={isPending}
                />
              </div>
            ))}
          </div>

          <DialogFooter className="px-0 pb-0">
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create floor"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
