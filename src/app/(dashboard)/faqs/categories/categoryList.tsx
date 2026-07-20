"use client";

import { useMemo, useState } from "react";
import {
  FolderOpen,
  ImageIcon,
  Languages,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useCreateFaqCategory,
  useDeleteFaqCategory,
  useUpdateFaqCategory,
} from "@/hooks/mutations/use-faq-category-mutations";
import { useFaqCategories } from "@/hooks/queries/use-faq-categories";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { FaqCategoryFormInput } from "@/schemas/faq-category.schema";
import type { FaqCategory } from "@/types/faq";
import CategoryCreateUpdate from "./categoryCreateUpdate";

const CARD_SHELL =
  "group relative gap-0 overflow-hidden p-0 shadow-none ring-1 ring-border/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-tan/50";

function localeChipClass(filled: boolean) {
  return cn(
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
    filled
      ? "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/30 dark:text-emerald-100"
      : "bg-muted/60 text-muted-foreground ring-1 ring-border/50",
  );
}

function LocaleCoverage({
  translations,
}: {
  translations: FaqCategory["translations"];
}) {
  const byLang = useMemo(
    () => new Map(translations.map((entry) => [entry.language, entry])),
    [translations],
  );

  const filledCount = APP_LANGUAGES.filter((lang) =>
    Boolean(byLang.get(lang)?.title?.trim()),
  ).length;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="text-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase">
        <Languages className="size-3" />
        Locales · {filledCount}/{APP_LANGUAGES.length}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {APP_LANGUAGES.map((lang) => {
          const entry = byLang.get(lang);
          const filled = Boolean(entry?.title?.trim());

          return (
            <span
              key={lang}
              className={localeChipClass(filled)}
              title={
                filled
                  ? `${entry?.title ?? ""} · /${entry?.slug ?? ""}`
                  : "Missing title for this locale"
              }
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  filled ? "bg-emerald-500" : "bg-muted-foreground/40",
                )}
              />
              {lang}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function CategoryCardSkeleton() {
  return (
    <Card className={cn(CARD_SHELL, "hover:translate-y-0 hover:shadow-none")}>
      <Skeleton className="aspect-16/10 w-full rounded-t-xl rounded-b-none" />
      <CardFooter className="flex flex-col items-center gap-3 border-t border-brand-tan/30 bg-linear-to-r from-brand/5 via-brand-cream/40 to-brand-tan/20 px-4 py-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-9 w-full max-w-[220px] rounded-lg" />
      </CardFooter>
    </Card>
  );
}

function CategoryHero({
  imageUrl,
  title,
}: {
  imageUrl?: string | null;
  title: string;
}) {
  if (imageUrl) {
    return (
      <div className="relative aspect-16/10 w-full overflow-hidden rounded-t-xl bg-brand-deep/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          className="size-full object-cover transition duration-700 ease-out group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-brand-deep/85 via-brand-deep/35 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-12">
          <p className="text-lg leading-tight font-semibold tracking-tight text-white drop-shadow-md">
            {title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-16/10 w-full overflow-hidden rounded-t-xl bg-linear-to-br from-primary/12 via-brand-cream/90 to-brand-tan/50">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, var(--color-primary) 0%, transparent 45%), radial-gradient(circle at 80% 70%, var(--color-brand-tan) 0%, transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-background/50 shadow-sm ring-1 ring-brand-tan/40 backdrop-blur-sm">
          <ImageIcon className="text-brand-deep/70 size-7" />
        </div>
        <p className="text-brand-deep max-w-[240px] text-lg leading-snug font-semibold tracking-tight">
          {title}
        </p>
        <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
          <Sparkles className="size-3" />
          Add a cover image
        </span>
      </div>
    </div>
  );
}

export function CategoryList() {
  const { data, isLoading, isError, error, refetch } = useFaqCategories({
    page: 1,
    limit: 100,
  });
  const createCategory = useCreateFaqCategory();
  const updateCategory = useUpdateFaqCategory();
  const deleteCategory = useDeleteFaqCategory();
  const askConfirm = useConfirm();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const categories = useMemo(() => {
    return [...(data?.data ?? [])].sort((a, b) => {
      const titleA =
        getPreferredTranslation(a.translations)?.title ?? a.title ?? "";
      const titleB =
        getPreferredTranslation(b.translations)?.title ?? b.title ?? "";
      return titleA.localeCompare(titleB);
    });
  }, [data?.data]);

  async function handleCreate(values: {
    id?: string;
    imageMediaId: string | null;
    translations: FaqCategoryFormInput["translations"];
  }) {
    await createCategory.mutateAsync({
      imageMediaId: values.imageMediaId,
      translations: values.translations,
    });
  }

  async function handleUpdate(values: {
    id?: string;
    imageMediaId: string | null;
    translations: FaqCategoryFormInput["translations"];
  }) {
    if (!values.id) {
      return;
    }

    await updateCategory.mutateAsync({
      id: values.id,
      payload: {
        imageMediaId: values.imageMediaId,
        translations: values.translations,
      },
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await askConfirm({
      title: "Delete this category?",
      description: "FAQs using it must be moved or deleted first.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(id);
    try {
      await deleteCategory.mutateAsync(id);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CategoryCreateUpdate
          mode="create"
          trigger="Create Category"
          onSave={handleCreate}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CategoryCardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40 shadow-md">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load categories</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error
                ? error.message
                : "Something went wrong while fetching categories."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && categories.length === 0 ? (
        <Card className="border-brand-tan/60 overflow-hidden border-dashed bg-linear-to-br from-brand-cream/30 via-background to-brand-tan/15 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-cream/60 ring-1 ring-brand-tan/50">
              <FolderOpen className="text-brand-deep size-8" />
            </div>
            <p className="text-lg font-semibold tracking-tight">No categories yet</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Create a category before adding FAQs. Each category can have its
              own cover and localized title.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && categories.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const preferred = getPreferredTranslation(category.translations);
              const displayTitle =
                preferred?.title?.trim() || "Untitled category";
              const hasImage = Boolean(category.imageMedia?.url);
              const isDeleting = pendingDeleteId === category.id;

              return (
                <Card key={category.id} className={CARD_SHELL}>
                  <CategoryHero
                    imageUrl={category.imageMedia?.url}
                    title={displayTitle}
                  />

                  <CardFooter className="flex flex-col items-center gap-3.5 border-t border-brand-tan/35 bg-linear-to-r from-brand/6 via-brand-cream/45 to-brand-tan/25 px-4 py-4 text-center">
                    {hasImage ? (
                      <Badge
                        variant="outline"
                        className="border-brand-tan/50 bg-background/70 text-brand-deep max-w-full truncate font-mono text-[11px] shadow-sm backdrop-blur-sm"
                        title={preferred?.slug}
                      >
                        /{preferred?.slug ?? "—"}
                      </Badge>
                    ) : (
                      <div className="space-y-1.5">
                        <Badge
                          variant="outline"
                          className="border-brand-tan/50 bg-background/70 text-brand-deep max-w-full truncate font-mono text-[11px] shadow-sm"
                          title={preferred?.slug}
                        >
                          /{preferred?.slug ?? "—"}
                        </Badge>
                      </div>
                    )}

                    <LocaleCoverage translations={category.translations} />

                    <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-xl bg-background/55 p-2 ring-1 ring-border/50 backdrop-blur-sm">
                      <CategoryCreateUpdate
                        mode="edit"
                        trigger="Edit"
                        defaultValues={category}
                        onSave={handleUpdate}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleteCategory.isPending}
                        onClick={() => void handleDelete(category.id)}
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="rounded-lg border border-brand-tan/40 bg-brand-cream/25 px-4 py-2.5 shadow-sm ring-1 ring-border/40">
            <p className="text-muted-foreground text-xs">
              {categories.length} categor
              {categories.length === 1 ? "y" : "ies"} · sorted alphabetically
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
