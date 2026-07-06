"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormInput, FormSelect, FormTextarea } from "@/components/form";
import { AudienceTabs } from "@/components/i18n/audience-tabs";
import { LanguageTabs } from "@/components/i18n/language-tabs";
import {
  useCreateAiKnowledge,
  useUpdateAiKnowledge,
} from "@/hooks/mutations/use-ai-knowledge-mutations";
import { useSpots } from "@/hooks/queries/use-spots";
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
import {
  emptyAudienceLanguageRecord,
  getPreferredAudienceTranslation,
} from "@/lib/i18n/translations";
import {
  aiKnowledgeFormSchema,
  type AiKnowledgeFormInput,
} from "@/schemas/ai-knowledge-form.schema";
import type { AiKnowledge } from "@/types/ai-knowledge";

const TOUR_LEVEL_VALUE = "__tour__";

type AiKnowledgeFormProps = {
  tourId: string;
  mode: "create" | "edit";
  defaultValues?: AiKnowledge;
};

function toFormValues(knowledge?: AiKnowledge): AiKnowledgeFormInput {
  return {
    spotId: knowledge?.spotId ?? TOUR_LEVEL_VALUE,
    sortOrder: knowledge?.sortOrder ?? 0,
    translations: emptyAudienceLanguageRecord((audience, language) => {
      const entry = knowledge?.translations.find(
        (translation) =>
          translation.language === language &&
          translation.audience === audience,
      );

      return {
        title: entry?.title ?? "",
        content: entry?.content ?? "",
        keywords: entry?.keywords ?? "",
      };
    }),
  };
}

export function AiKnowledgeForm({
  tourId,
  mode,
  defaultValues,
}: AiKnowledgeFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeAudience, setActiveAudience] =
    useState<AudienceType>(DEFAULT_AUDIENCE);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);
  const createKnowledge = useCreateAiKnowledge(tourId);
  const updateKnowledge = useUpdateAiKnowledge(tourId);
  const { data: spotsData } = useSpots(tourId);

  const form = useForm<AiKnowledgeFormInput>({
    resolver: zodResolver(aiKnowledgeFormSchema),
    defaultValues: toFormValues(defaultValues),
  });

  const spots = spotsData?.data ?? [];
  const isPending = createKnowledge.isPending || updateKnowledge.isPending;

  const spotOptions = [
    { label: "Tour-level (all spots)", value: TOUR_LEVEL_VALUE },
    ...spots.map((spot) => ({
      label: `${spot.sortOrder}. ${getPreferredAudienceTranslation(spot.translations)?.title ?? "Spot"}`,
      value: spot.id,
    })),
  ];

  async function onSubmit(values: AiKnowledgeFormInput) {
    setSubmitError(null);

    const payload = {
      spotId: values.spotId === TOUR_LEVEL_VALUE ? null : values.spotId,
      sortOrder: values.sortOrder,
      translations: emptyAudienceLanguageRecord((audience, language) => ({
        title: values.translations[audience][language].title,
        content: values.translations[audience][language].content,
        keywords: values.translations[audience][language].keywords,
      })),
    };

    try {
      if (mode === "edit" && defaultValues) {
        await updateKnowledge.mutateAsync({
          knowledgeId: defaultValues.id,
          payload,
        });
        router.push(`/tours/${tourId}/ai-knowledge`);
        return;
      }

      await createKnowledge.mutateAsync(payload);
      router.push(`/tours/${tourId}/ai-knowledge`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not save AI knowledge entry.",
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
          <CardTitle>Scope</CardTitle>
          <CardDescription>
            Tour-level chunks apply to the whole tour. Spot-level chunks are
            grounded to one stop.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            name="spotId"
            label="Scope"
            options={spotOptions}
          />
          <FormInput name="sortOrder" label="Order" type="number" min={0} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Corpus (audience × en / es / fr)</CardTitle>
          <CardDescription>
            Plain text only — used for offline search retrieval. No answers
            outside this content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AudienceTabs value={activeAudience} onChange={setActiveAudience} />
          <LanguageTabs
            value={activeLanguage}
            onChange={setActiveLanguage}
          />
          {AUDIENCE_LABELS[activeAudience] ? (
            <p className="text-muted-foreground text-sm font-medium">
              {AUDIENCE_LABELS[activeAudience]}
            </p>
          ) : null}
          {APP_LANGUAGES.map((language) => (
            <div
              key={language}
              className={language === activeLanguage ? "space-y-4" : "hidden"}
            >
              <p className="text-muted-foreground text-sm font-medium">
                {LANGUAGE_LABELS[language]}
              </p>
              <FormInput
                name={`translations.${activeAudience}.${language}.title`}
                label="Title"
                placeholder="Optional short label"
              />
              <FormTextarea
                name={`translations.${activeAudience}.${language}.content`}
                label="Content"
                rows={8}
                placeholder="Facts the AI may use when answering"
              />
              <FormInput
                name={`translations.${activeAudience}.${language}.keywords`}
                label="Keywords"
                placeholder="comma, separated, search, terms"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? "Create entry" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/tours/${tourId}/ai-knowledge`} />}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
}
