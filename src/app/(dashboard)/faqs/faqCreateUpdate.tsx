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
import { Form, FormInput, FormQuill, FormSelect } from "@/components/form";
import { LanguageTabs } from "@/components/i18n/language-tabs";
import { useFaqCategories } from "@/hooks/queries/use-faq-categories";
import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_LABELS,
  type AppLanguage,
} from "@/lib/i18n/languages";
import {
  emptyLanguageRecord,
  getPreferredTranslation,
  translationsToRecord,
} from "@/lib/i18n/translations";
import { buildFaqAnswer } from "@/modules/faq/faq.answer";
import type { FaqDto } from "@/modules/faq/faq.types";
import { faqFormSchema, type FaqFormInput } from "@/schemas/faq.schema";

type FaqSavePayload = {
  id?: string;
  categoryId: string;
  translations: FaqFormInput["translations"];
};

type FaqCreateUpdateProps = {
  mode?: "create" | "edit";
  title?: string;
  description?: string;
  trigger?: string;
  defaultValues?: Partial<FaqDto>;
  onSave?: (values: FaqSavePayload) => void | Promise<void>;
};

function emptyTranslation() {
  return {
    question: "",
    answer_html: "",
    answer_text: "",
  };
}

const emptyValues: FaqFormInput = {
  categoryId: "",
  translations: emptyLanguageRecord(() => emptyTranslation()),
};

function toFormValues(values?: Partial<FaqDto>): FaqFormInput {
  const byLanguage = translationsToRecord(values?.translations ?? []);

  return {
    categoryId: values?.categoryId ?? values?.category?.id ?? "",
    translations: emptyLanguageRecord((language) => {
      const entry = byLanguage[language as AppLanguage];
      const answer = buildFaqAnswer(entry?.answer_html ?? "");

      return {
        question: entry?.question ?? "",
        answer_html: answer.answer_html || entry?.answer_html || "",
        answer_text: answer.answer_text || entry?.answer_text || "",
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

  return "Unable to save FAQ.";
}

export default function FaqCreateUpdate({
  mode = "create",
  title,
  description,
  trigger,
  defaultValues,
  onSave,
}: FaqCreateUpdateProps) {
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);
  const { data: categoriesResponse, isLoading: isCategoriesLoading } =
    useFaqCategories({ page: 1, limit: 100 });

  const categories = categoriesResponse?.data ?? [];
  const categoryOptions = categories.map((category) => {
    const preferred = getPreferredTranslation(category.translations);

    return {
      label: preferred?.title ?? category.title ?? "Untitled",
      value: category.id,
    };
  });

  const form = useForm<FaqFormInput>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setSubmitError(null);
      setActiveLanguage(DEFAULT_LANGUAGE);
      form.reset(toFormValues(defaultValues));
    }
  }

  async function handleSubmit(values: FaqFormInput) {
    setSubmitError(null);

    const translations = emptyLanguageRecord((language) => {
      const entry = values.translations[language];
      const answer = buildFaqAnswer(entry.answer_html);

      return {
        question: entry.question,
        answer_html: answer.answer_html,
        answer_text: answer.answer_text,
      };
    });

    try {
      await onSave?.({
        id: defaultValues?.id,
        categoryId: values.categoryId,
        translations,
      });

      setOpen(false);
      form.reset(isEdit ? { ...values, translations } : emptyValues);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  }

  const dialogTitle = title ?? (isEdit ? "Edit FAQ" : "Create FAQ");
  const dialogDescription =
    description ??
    (isEdit
      ? "Update this FAQ in English, Spanish, and French."
      : "Add a FAQ in English, Spanish, and French.");
  const triggerLabel = trigger ?? (isEdit ? "Edit" : "Create New");
  const submitLabel = isEdit ? "Save changes" : "Create FAQ";
  const isSubmitting = form.formState.isSubmitting;

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={handleSubmit} className="space-y-5">
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <FormSelect
            name="categoryId"
            label="Category"
            placeholder={
              isCategoriesLoading
                ? "Loading categories..."
                : categoryOptions.length === 0
                  ? "Create a category first"
                  : "Select a category"
            }
            options={categoryOptions}
            disabled={isSubmitting || isCategoriesLoading}
            description={
              categoryOptions.length === 0
                ? "Add categories under FAQ Management → Categories."
                : undefined
            }
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
                name={`translations.${language}.question`}
                label={`Title (${LANGUAGE_LABELS[language]})`}
                placeholder="How does billing work?"
                autoComplete="off"
                disabled={isSubmitting}
              />

              <FormQuill
                htmlName={`translations.${language}.answer_html`}
                textName={`translations.${language}.answer_text`}
                label={`Answer (${LANGUAGE_LABELS[language]})`}
                description="Rich text is stored as Quill HTML; plain text is derived automatically."
                placeholder="Write the answer…"
                disabled={isSubmitting}
              />
            </div>
          ))}

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" />}
              disabled={isSubmitting}
            >
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || categoryOptions.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
