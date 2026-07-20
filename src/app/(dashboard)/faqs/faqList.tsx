"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FaqAnswer } from "@/components/faq/faq-answer";
import {
  useCreateFaq,
  useDeleteFaq,
  useUpdateFaq,
} from "@/hooks/mutations/use-faq-mutations";
import { useFaqs } from "@/hooks/queries/use-faqs";
import { APP_LANGUAGES, LANGUAGE_LABELS } from "@/lib/i18n/languages";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import type { FaqFormInput } from "@/schemas/faq.schema";
import FaqCreateUpdate from "./faqCreateUpdate";

export function FaqList() {
  const { data, isLoading, isError, error, refetch } = useFaqs({
    page: 1,
    limit: 100,
  });
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const askConfirm = useConfirm();

  const faqs = data?.data ?? [];

  async function handleCreate(values: {
    id?: string;
    categoryId: string;
    translations: FaqFormInput["translations"];
  }) {
    await createFaq.mutateAsync({
      categoryId: values.categoryId,
      translations: values.translations,
    });
  }

  async function handleUpdate(values: {
    id?: string;
    categoryId: string;
    translations: FaqFormInput["translations"];
  }) {
    if (!values.id) {
      return;
    }

    await updateFaq.mutateAsync({
      id: values.id,
      payload: {
        categoryId: values.categoryId,
        translations: values.translations,
      },
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await askConfirm({
      title: "Delete this FAQ?",
      description: "This action cannot be undone.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    await deleteFaq.mutateAsync(id);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">All FAQs</h2>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            FAQs are stored in English, Spanish, and French. End users see the
            language they select in the app.
          </p>
        </div>
        <FaqCreateUpdate
          mode="create"
          trigger="Create New"
          onSave={handleCreate}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="space-y-4 p-6">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load FAQs</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error
                ? error.message
                : "Something went wrong while fetching FAQs."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && faqs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No FAQs yet</p>
            <p className="text-muted-foreground text-sm">
              Create a category first, then add your first FAQ.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && faqs.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {faqs.map((faq) => {
            const preferred = getPreferredTranslation(faq.translations);
            const categoryTitle =
              getPreferredTranslation(faq.category.translations ?? [])?.title ??
              faq.category.title;

            return (
              <Card
                key={faq.id}
                className="flex h-full flex-col border border-border/80 shadow-sm"
              >
                <CardHeader className="space-y-4 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{categoryTitle}</Badge>
                    {APP_LANGUAGES.map((language) => (
                      <Badge
                        key={language}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {LANGUAGE_LABELS[language]}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-base leading-snug font-semibold tracking-tight">
                    {preferred?.question ?? "Untitled FAQ"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  <FaqAnswer
                    answerHtml={preferred?.answer_html ?? ""}
                    answerText={preferred?.answer_text ?? ""}
                    className="line-clamp-5"
                  />
                </CardContent>

                <CardFooter className="mt-auto flex items-center justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                  <FaqCreateUpdate
                    mode="edit"
                    trigger="Edit"
                    defaultValues={faq}
                    onSave={handleUpdate}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleteFaq.isPending}
                    onClick={() => void handleDelete(faq.id)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
