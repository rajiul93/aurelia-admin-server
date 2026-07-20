"use client";

import { useMemo, useState } from "react";
import {
  CircleHelp,
  Languages,
  Loader2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useCreateFaq,
  useDeleteFaq,
  useUpdateFaq,
} from "@/hooks/mutations/use-faq-mutations";
import { useFaqs } from "@/hooks/queries/use-faqs";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { FaqFormInput } from "@/schemas/faq.schema";
import type { Faq } from "@/types/faq";
import FaqCreateUpdate from "./faqCreateUpdate";

const CATEGORY_PALETTE = [
  "border-primary/30 bg-primary/8 text-primary",
  "border-violet-500/30 bg-violet-500/8 text-violet-900 dark:text-violet-200",
  "border-sky-500/30 bg-sky-500/8 text-sky-900 dark:text-sky-200",
  "border-emerald-500/30 bg-emerald-500/8 text-emerald-900 dark:text-emerald-200",
  "border-amber-500/30 bg-amber-500/8 text-amber-950 dark:text-amber-100",
  "border-rose-500/30 bg-rose-500/8 text-rose-900 dark:text-rose-200",
] as const;

function categoryBadgeClass(categoryId: string) {
  let hash = 0;
  for (let i = 0; i < categoryId.length; i += 1) {
    hash = (hash + categoryId.charCodeAt(i) * (i + 1)) % CATEGORY_PALETTE.length;
  }
  return CATEGORY_PALETTE[hash] ?? CATEGORY_PALETTE[0];
}

function CategoryBadge({
  categoryId,
  title,
}: {
  categoryId: string;
  title: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "max-w-[160px] truncate font-medium",
        categoryBadgeClass(categoryId),
      )}
      title={title}
    >
      {title}
    </Badge>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function LocaleCoverage({ translations }: { translations: Faq["translations"] }) {
  const byLang = useMemo(
    () => new Map(translations.map((entry) => [entry.language, entry])),
    [translations],
  );

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {APP_LANGUAGES.map((lang) => {
        const entry = byLang.get(lang);
        const filled = Boolean(entry?.question?.trim());

        return (
          <span
            key={lang}
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
              filled
                ? "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/25 dark:text-emerald-200"
                : "bg-muted/80 text-muted-foreground ring-1 ring-border/60",
            )}
            title={
              filled
                ? entry?.question.slice(0, 120)
                : "Missing question for this locale"
            }
          >
            {lang}
          </span>
        );
      })}
    </div>
  );
}

function FaqsTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden p-0 py-0">
      <CardContent className="p-0 pt-0">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FaqList() {
  const { data, isLoading, isError, error, refetch } = useFaqs({
    page: 1,
    limit: 100,
  });
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const askConfirm = useConfirm();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const faqs = useMemo(() => {
    return [...(data?.data ?? [])].sort((a, b) => {
      const catA =
        getPreferredTranslation(a.category.translations ?? [])?.title ??
        a.category.title;
      const catB =
        getPreferredTranslation(b.category.translations ?? [])?.title ??
        b.category.title;
      const byCategory = catA.localeCompare(catB);
      if (byCategory !== 0) {
        return byCategory;
      }

      const qA = getPreferredTranslation(a.translations)?.question ?? "";
      const qB = getPreferredTranslation(b.translations)?.question ?? "";
      return qA.localeCompare(qB);
    });
  }, [data?.data]);

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

    setPendingDeleteId(id);
    try {
      await deleteFaq.mutateAsync(id);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <FaqCreateUpdate
          mode="create"
          trigger="Create New"
          onSave={handleCreate}
        />
      </div>

      {isLoading ? <FaqsTableSkeleton /> : null}

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
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CircleHelp className="text-muted-foreground size-10" />
            <p className="font-medium">No FAQs yet</p>
            <p className="text-muted-foreground text-sm">
              Create a category first, then add your first FAQ.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && faqs.length > 0 ? (
        <Card className="gap-0 overflow-hidden p-0 py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Category
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Question
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Answer preview
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    <span className="inline-flex items-center justify-center gap-1">
                      <Languages className="size-3.5" />
                      Locales
                    </span>
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Updated
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-right text-xs font-semibold tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {faqs.map((faq, rowIndex) => {
                  const preferred = getPreferredTranslation(faq.translations);
                  const categoryTitle =
                    getPreferredTranslation(faq.category.translations ?? [])
                      ?.title ?? faq.category.title;
                  const isDeleting = pendingDeleteId === faq.id;
                  const answerPreview =
                    preferred?.answer_text?.trim() ||
                    preferred?.question?.trim() ||
                    "";

                  return (
                    <tr
                      key={faq.id}
                      className={cn(
                        "transition-colors hover:bg-brand-cream/35",
                        rowIndex % 2 === 1 && "bg-muted/15",
                      )}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <CategoryBadge
                          categoryId={faq.categoryId}
                          title={categoryTitle}
                        />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="max-w-xs font-semibold leading-snug tracking-tight">
                          {preferred?.question ?? (
                            <span className="text-muted-foreground font-normal italic">
                              Untitled FAQ
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="text-muted-foreground line-clamp-2 max-w-md text-xs leading-relaxed">
                          {answerPreview || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <LocaleCoverage translations={faq.translations} />
                      </td>
                      <td className="text-muted-foreground px-4 py-3.5 align-middle text-xs whitespace-nowrap">
                        {formatDate(faq.updatedAt)}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <FaqCreateUpdate
                            mode="edit"
                            trigger="Edit"
                            defaultValues={faq}
                            onSave={handleUpdate}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deleteFaq.isPending}
                            aria-label="Delete FAQ"
                            onClick={() => void handleDelete(faq.id)}
                          >
                            {isDeleting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <CardFooter className="border-brand-tan/40 bg-brand-cream/25 flex-col items-start gap-0 border-t px-4 py-2.5 sm:flex-row sm:items-center">
            <p className="text-muted-foreground text-xs">
              {faqs.length} FAQ{faqs.length === 1 ? "" : "s"} · sorted by
              category, then question
            </p>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
