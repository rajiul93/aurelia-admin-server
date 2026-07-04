"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, SquarePen } from "lucide-react";
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
import { LanguageTabs } from "@/components/i18n/language-tabs";
import { resolveMediaUpload } from "@/lib/media/client";
import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  type AppLanguage,
} from "@/lib/i18n/languages";
import {
  emptyLanguageRecord,
  translationsToRecord,
} from "@/lib/i18n/translations";
import { slugify } from "@/lib/slug";
import type { FaqCategory } from "@/types/faq";
import { defaultMediaFieldValue } from "@/types/media";
import {
  faqCategoryFormSchema,
  type FaqCategoryFormInput,
} from "@/schemas/faq-category.schema";

type CategorySavePayload = {
  id?: string;
  imageMediaId: string | null;
  translations: FaqCategoryFormInput["translations"];
};

type CategoryCreateUpdateProps = {
  mode?: "create" | "edit";
  trigger?: string;
  defaultValues?: FaqCategory;
  onSave?: (values: CategorySavePayload) => void | Promise<void>;
};

function emptyTranslation() {
  return {
    title: "",
    slug: "",
  };
}

const emptyValues: FaqCategoryFormInput = {
  image: defaultMediaFieldValue,
  translations: emptyLanguageRecord(() => emptyTranslation()),
};

function toFormValues(values?: FaqCategory): FaqCategoryFormInput {
  const byLanguage = translationsToRecord(values?.translations ?? []);

  return {
    image: defaultMediaFieldValue,
    translations: emptyLanguageRecord((language) => {
      const entry = byLanguage[language];

      return {
        title: entry?.title ?? "",
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

  return "Unable to save category.";
}

export default function CategoryCreateUpdate({
  mode = "create",
  trigger,
  defaultValues,
  onSave,
}: CategoryCreateUpdateProps) {
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [slugTouched, setSlugTouched] = useState<Record<AppLanguage, boolean>>(
    emptyLanguageRecord(() => false),
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const form = useForm<FaqCategoryFormInput>({
    resolver: zodResolver(faqCategoryFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setSubmitError(null);
      setActiveLanguage(DEFAULT_LANGUAGE);
      setUploadProgress(null);
      setSlugTouched(
        emptyLanguageRecord((language) =>
          Boolean(
            defaultValues?.translations.find(
              (entry) => entry.language === language,
            )?.slug,
          ),
        ),
      );
      form.reset(toFormValues(defaultValues));
    }
  }

  async function handleSubmit(values: FaqCategoryFormInput) {
    setSubmitError(null);

    const translations = emptyLanguageRecord((language) => {
      const entry = values.translations[language];
      const slug = entry.slug.trim() || slugify(entry.title);

      return {
        title: entry.title,
        slug,
      };
    });

    for (const language of APP_LANGUAGES) {
      if (!translations[language].slug) {
        form.setError(`translations.${language}.slug`, {
          message: "Slug is required",
        });
        setActiveLanguage(language);
        return;
      }
    }

    try {
      const imageMediaId =
        (await resolveMediaUpload(values.image, defaultValues?.imageMediaId, {
          onProgress: setUploadProgress,
        })) ?? null;

      await onSave?.({
        id: defaultValues?.id,
        imageMediaId,
        translations,
      });

      setOpen(false);
      form.reset(emptyValues);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setUploadProgress(null);
    }
  }

  const isSubmitting = form.formState.isSubmitting;
  const triggerLabel = trigger ?? (isEdit ? "Edit" : "Create Category");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={isEdit ? "border-primary" : undefined}
          />
        }
      >
        {isEdit ? <SquarePen className="text-primary size-4" /> : null}
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            Provide title and slug for English, Spanish, and French. Image is
            shared across languages.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={handleSubmit} className="space-y-5">
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <FormImageUpload
            name="image"
            label="Image"
            description="Optional category image. Uploads when you save."
            existingMedia={defaultValues?.imageMedia}
            isUploading={isSubmitting && uploadProgress !== null}
            uploadProgress={uploadProgress ?? undefined}
            disabled={isSubmitting}
          />

          <div className="space-y-3">
            <LanguageTabs
              value={activeLanguage}
              onChange={setActiveLanguage}
            />
            <p className="text-muted-foreground text-xs">
              Editing {LANGUAGE_LABELS[activeLanguage]}. All three languages are
              required.
            </p>
          </div>

          {APP_LANGUAGES.map((language) => (
            <div
              key={language}
              className={language === activeLanguage ? "space-y-5" : "hidden"}
            >
              <FormInput
                name={`translations.${language}.title`}
                label={`Title (${LANGUAGE_LABELS[language]})`}
                placeholder="Billing"
                autoComplete="off"
                disabled={isSubmitting}
                onChange={(event) => {
                  if (!slugTouched[language]) {
                    form.setValue(
                      `translations.${language}.slug`,
                      slugify(event.currentTarget.value),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }
                }}
              />

              <FormInput
                name={`translations.${language}.slug`}
                label={`Slug (${LANGUAGE_LABELS[language]})`}
                placeholder="billing"
                autoComplete="off"
                disabled={isSubmitting}
                description="Used in URLs. Auto-generated from the title unless you edit it."
                onChange={() =>
                  setSlugTouched((current) => ({
                    ...current,
                    [language]: true,
                  }))
                }
              />
            </div>
          ))}

          <DialogFooter className="px-0 pb-0">
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={isSubmitting}
            >
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create category"
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
