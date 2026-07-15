"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormInput, FormTextarea, FormImageUpload, FormField } from "@/components/form";
import { LanguageTabs } from "@/components/i18n/language-tabs";
import { resolveMediaUpload } from "@/lib/media/client";
import { useCreateHost, useUpdateHost } from "@/hooks/mutations/use-host-mutations";
import { hostFormSchema, type HostFormData } from "@/schemas/host-form.schema";
import { APP_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from "@/lib/i18n/languages";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { Host } from "@/types/host";

interface HostFormDialogProps {
  tourId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHost?: Host | null;
}

export function HostFormDialog({
  tourId,
  open,
  onOpenChange,
  editingHost,
}: HostFormDialogProps) {
  const createMutation = useCreateHost(tourId);
  const updateMutation = useUpdateHost(tourId, editingHost?.id ?? "");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const isPending = createMutation.isPending || updateMutation.isPending;

  function getDefaultTranslations() {
    if (editingHost) {
      const translations: Record<AppLanguage, { bio: string }> = {
        en: { bio: "" },
        es: { bio: "" },
        fr: { bio: "" },
      };
      editingHost.translations.forEach((t) => {
        translations[t.language as AppLanguage] = { bio: t.bio };
      });
      return translations;
    }
    return {
      en: { bio: "" },
      es: { bio: "" },
      fr: { bio: "" },
    };
  }

  const form = useForm<HostFormData>({
    resolver: zodResolver(hostFormSchema),
    defaultValues: {
      name: editingHost?.name ?? "",
      role: editingHost?.role ?? "",
      photo: { file: null, removeExisting: false },
      latitude: editingHost?.latitude ?? 0,
      longitude: editingHost?.longitude ?? 0,
      availableFrom: editingHost?.availableFrom ?? null,
      availableTo: editingHost?.availableTo ?? null,
      isActive: editingHost?.isActive ?? true,
      sortOrder: editingHost?.sortOrder ?? 0,
      translations: getDefaultTranslations(),
    },
  });

  async function onSubmit(values: HostFormData) {
    setSubmitError(null);

    try {
      const photoMediaId = await resolveMediaUpload(values.photo, editingHost?.photoMediaId, {
        onProgress: setUploadProgress,
      });

      const payload = {
        name: values.name,
        role: values.role || null,
        photoMediaId: photoMediaId ?? null,
        latitude: values.latitude,
        longitude: values.longitude,
        availableFrom: values.availableFrom || null,
        availableTo: values.availableTo || null,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        translations: values.translations,
      };

      if (editingHost) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Could not save host."));
    } finally {
      setUploadProgress(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingHost ? "Edit Host" : "Add Host"}</DialogTitle>
        </DialogHeader>

        <Form form={form} onSubmit={onSubmit} className="space-y-5">
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="name"
              label="Name"
              placeholder="Host name"
              disabled={isPending}
            />

            <FormInput
              name="role"
              label="Role (optional)"
              placeholder="e.g., Aurelia Host"
              disabled={isPending}
            />
          </div>

          <FormImageUpload
            name="photo"
            label="Photo"
            description="Optional. Shown on the host card in the app."
            existingMedia={editingHost?.photoUrl ? { url: editingHost.photoUrl } : null}
            isUploading={isPending && uploadProgress !== null}
            uploadProgress={uploadProgress ?? undefined}
            disabled={isPending}
          />

          <div className="space-y-4">
            <LanguageTabs value={activeLanguage} onChange={setActiveLanguage} />
            <p className="text-muted-foreground text-sm font-medium">
              Bio description for {activeLanguage.toUpperCase()}
            </p>

            {APP_LANGUAGES.map((language) => (
              <div
                key={language}
                className={language === activeLanguage ? "" : "hidden"}
              >
                <FormTextarea
                  name={`translations.${language}.bio`}
                  label={`Bio (${language.toUpperCase()})`}
                  placeholder="Host biography"
                  disabled={isPending}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="latitude"
              label="Latitude"
              type="number"
              step="any"
              placeholder="0.0"
              disabled={isPending}
            />

            <FormInput
              name="longitude"
              label="Longitude"
              type="number"
              step="any"
              placeholder="0.0"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="availableFrom"
              label="Available From (optional)"
              type="time"
              description="Start time for this location (24h format)"
              disabled={isPending}
            />

            <FormInput
              name="availableTo"
              label="Available Until (optional)"
              type="time"
              description="End time for this location (24h format)"
              disabled={isPending}
            />
          </div>

          <FormField name="isActive" label="Active (manual override, independent of schedule)">
            {(field) => (
              <input
                type="checkbox"
                id="isActive"
                checked={Boolean(field.value)}
                onChange={(e) => field.onChange(e.target.checked)}
                className="rounded border"
                disabled={isPending}
              />
            )}
          </FormField>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : editingHost ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
