"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormInput, FormQuill } from "@/components/form";
import { AudienceTabs } from "@/components/i18n/audience-tabs";
import { LanguageTabs } from "@/components/i18n/language-tabs";
import {
  useCreateSpotFaq,
  useDeleteSpotFaq,
} from "@/hooks/mutations/use-spot-mutations";
import { useSpot } from "@/hooks/queries/use-spots";
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
  spotFaqFormSchema,
  type SpotFaqFormInput,
} from "@/schemas/spot-form.schema";

export default function SpotFaqsPage() {
  const params = useParams<{ tourId: string; spotId: string }>();
  const { data, isLoading } = useSpot(params.tourId, params.spotId);
  const createFaq = useCreateSpotFaq(params.tourId, params.spotId);
  const deleteFaq = useDeleteSpotFaq(params.tourId, params.spotId);
  const askConfirm = useConfirm();

  async function handleDeleteFaq(faqId: string) {
    const confirmed = await askConfirm({
      title: "Delete this FAQ?",
      description: "This action cannot be undone.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    await deleteFaq.mutateAsync(faqId);
  }
  const [activeAudience, setActiveAudience] =
    useState<AudienceType>(DEFAULT_AUDIENCE);
  const [activeLanguage, setActiveLanguage] =
    useState<AppLanguage>(DEFAULT_LANGUAGE);

  const form = useForm<SpotFaqFormInput>({
    resolver: zodResolver(spotFaqFormSchema),
    defaultValues: {
      sortOrder: 0,
      translations: emptyAudienceLanguageRecord(() => ({
        question: "",
        answer_html: "",
        answer_text: "",
      })),
    },
  });

  const spot = data?.data;
  const isSubmitting = form.formState.isSubmitting;

  async function handleSubmit(values: SpotFaqFormInput) {
    await createFaq.mutateAsync({
      sortOrder: values.sortOrder,
      translations: values.translations,
    });

    form.reset({
      sortOrder: values.sortOrder + 1,
      translations: emptyAudienceLanguageRecord(() => ({
        question: "",
        answer_html: "",
        answer_text: "",
      })),
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link href={`/tours/${params.tourId}/spots`} className="hover:underline">
            Back to spots
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Spot FAQs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              name="sortOrder"
              label="Order"
              type="number"
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
                    name={`translations.${audience}.${language}.question`}
                    label="Question"
                    disabled={isSubmitting}
                  />
                  <FormQuill
                    htmlName={`translations.${audience}.${language}.answer_html`}
                    textName={`translations.${audience}.${language}.answer_text`}
                    label="Answer"
                    disabled={isSubmitting}
                  />
                </div>
              )),
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add FAQ"
              )}
            </Button>
          </Form>
        </CardContent>
      </Card>

      {isLoading ? null : (
        <div className="space-y-4">
          {spot?.faqs.map((faq) => {
            const preferred = getPreferredAudienceTranslation(faq.translations);

            return (
              <Card key={faq.id}>
                <CardContent className="space-y-2 pt-6">
                  <p className="font-medium">
                    #{faq.sortOrder} — {preferred?.question}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteFaq.isPending}
                    onClick={() => void handleDeleteFaq(faq.id)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
