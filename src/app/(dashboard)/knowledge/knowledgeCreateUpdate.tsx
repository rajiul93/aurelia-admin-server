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
import { Form, FormField, FormInput, FormQuill, FormSelect } from "@/components/form";
import { LanguageTabs } from "@/components/i18n/language-tabs";
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
import { buildFaqAnswer } from "@/modules/faq/faq.answer";
import type {
  KnowledgeArticle,
  KnowledgeCategory,
} from "@/types/knowledge-article";
import {
  knowledgeArticleFormSchema,
  type KnowledgeArticleFormInput,
} from "@/schemas/knowledge-article.schema";

type SavePayload = {
  id?: string;
  key: string;
  category: KnowledgeCategory;
  includeInAssistant: boolean;
  sortOrder: number;
  icon: string;
  translations: KnowledgeArticleFormInput["translations"];
};

type Props = {
  mode?: "create" | "edit";
  trigger?: string;
  defaultCategory?: KnowledgeCategory;
  defaultValues?: Partial<KnowledgeArticle>;
  onSave?: (values: SavePayload) => void | Promise<void>;
};

const CATEGORY_OPTIONS = [
  { label: "Knowledge Base (assistant)", value: "KNOWLEDGE" },
  { label: "Info Page (drawer)", value: "INFO_PAGE" },
  { label: "Legal Page (drawer)", value: "LEGAL" },
];

function toFormValues(
  values?: Partial<KnowledgeArticle>,
  defaultCategory?: KnowledgeCategory,
): KnowledgeArticleFormInput {
  const byLanguage = translationsToRecord(values?.translations ?? []);

  return {
    key: values?.key ?? "",
    category: values?.category ?? defaultCategory ?? "KNOWLEDGE",
    includeInAssistant: values?.includeInAssistant ?? true,
    sortOrder: values?.sortOrder ?? 0,
    icon: values?.icon ?? "",
    translations: emptyLanguageRecord((language) => {
      const entry = byLanguage[language as AppLanguage];
      const body = buildFaqAnswer(entry?.bodyHtml ?? "");

      return {
        title: entry?.title ?? "",
        bodyHtml: body.answer_html || entry?.bodyHtml || "",
        bodyText: body.answer_text || entry?.bodyText || "",
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

  return "Unable to save content.";
}

export default function KnowledgeCreateUpdate({
  mode = "create",
  trigger,
  defaultCategory,
  defaultValues,
  onSave,
}: Props) {
  const isEdit = mode === "edit";
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);

  const form = useForm<KnowledgeArticleFormInput>({
    resolver: zodResolver(knowledgeArticleFormSchema),
    defaultValues: toFormValues(defaultValues, defaultCategory),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSubmitError(null);
      setActiveLanguage(DEFAULT_LANGUAGE);
      form.reset(toFormValues(defaultValues, defaultCategory));
    }
  }

  async function handleSubmit(values: KnowledgeArticleFormInput) {
    setSubmitError(null);

    const translations = emptyLanguageRecord((language) => {
      const entry = values.translations[language];
      const body = buildFaqAnswer(entry.bodyHtml);
      return {
        title: entry.title,
        bodyHtml: body.answer_html,
        bodyText: body.answer_text,
      };
    });

    try {
      await onSave?.({
        id: defaultValues?.id,
        key: values.key,
        category: values.category,
        includeInAssistant: values.includeInAssistant,
        sortOrder: values.sortOrder,
        icon: values.icon,
        translations,
      });
      setOpen(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  }

  const dialogTitle = isEdit ? "Edit content" : "Create content";
  const triggerLabel = trigger ?? (isEdit ? "Edit" : "Create New");
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
          <DialogDescription>
            Content is stored in English, Spanish, and French. Users see the
            language they select in the app.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onSubmit={handleSubmit} className="space-y-5">
          {submitError ? (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              name="key"
              label="Key"
              placeholder="privacy-policy"
              autoComplete="off"
              disabled={isSubmitting}
              description="Stable lowercase id, e.g. privacy-policy"
            />
            <FormSelect
              name="category"
              label="Type"
              options={CATEGORY_OPTIONS}
              disabled={isSubmitting}
            />
            <FormInput
              name="sortOrder"
              label="Sort order"
              type="number"
              min={0}
              disabled={isSubmitting}
            />
            <FormInput
              name="icon"
              label="Icon (Ionicons name)"
              placeholder="shield-checkmark-outline"
              autoComplete="off"
              disabled={isSubmitting}
            />
            <FormField name="includeInAssistant" label="Assistant">
              {(field) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  Use as a source for the Aurelia Assistant
                </label>
              )}
            </FormField>
          </div>

          <div className="space-y-3">
            <LanguageTabs value={activeLanguage} onChange={setActiveLanguage} />
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
                placeholder="Privacy Policy"
                autoComplete="off"
                disabled={isSubmitting}
              />
              <FormQuill
                htmlName={`translations.${language}.bodyHtml`}
                textName={`translations.${language}.bodyText`}
                label={`Content (${LANGUAGE_LABELS[language]})`}
                description="Rich text is stored as Quill HTML; plain text is derived automatically."
                placeholder="Write the content…"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
