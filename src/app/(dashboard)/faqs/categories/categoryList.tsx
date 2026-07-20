"use client";

import { ImageIcon, Trash2 } from "lucide-react";
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
import {
  useCreateFaqCategory,
  useDeleteFaqCategory,
  useUpdateFaqCategory,
} from "@/hooks/mutations/use-faq-category-mutations";
import { useFaqCategories } from "@/hooks/queries/use-faq-categories";
import { APP_LANGUAGES, LANGUAGE_LABELS } from "@/lib/i18n/languages";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import type { FaqCategoryFormInput } from "@/schemas/faq-category.schema";
import CategoryCreateUpdate from "./categoryCreateUpdate";

export function CategoryList() {
  const { data, isLoading, isError, error, refetch } = useFaqCategories({
    page: 1,
    limit: 100,
  });
  const createCategory = useCreateFaqCategory();
  const updateCategory = useUpdateFaqCategory();
  const deleteCategory = useDeleteFaqCategory();
  const askConfirm = useConfirm();

  const categories = data?.data ?? [];

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

    await deleteCategory.mutateAsync(id);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">FAQ Categories</h2>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Categories store title and slug in English, Spanish, and French.
            Images are shared across languages.
          </p>
        </div>
        <CategoryCreateUpdate
          mode="create"
          trigger="Create Category"
          onSave={handleCreate}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="space-y-4 p-6">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-6 w-2/3" />
            </Card>
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40">
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No categories yet</p>
            <p className="text-muted-foreground text-sm">
              Create a category before adding FAQs.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && categories.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const preferred = getPreferredTranslation(category.translations);

            return (
              <Card
                key={category.id}
                className="flex h-full flex-col overflow-hidden border border-border/80 shadow-sm"
              >
                <div className="bg-muted relative flex h-36 items-center justify-center overflow-hidden">
                  {category.imageMedia?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={category.imageMedia.url}
                      alt={preferred?.title ?? "Category"}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="text-muted-foreground size-10" />
                  )}
                </div>

                <CardHeader className="space-y-3 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {preferred?.slug ?? "—"}
                    </Badge>
                    {APP_LANGUAGES.map((language) => (
                      <Badge
                        key={language}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {LANGUAGE_LABELS[language]}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-base leading-snug font-semibold tracking-tight">
                    {preferred?.title ?? "Untitled category"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 pb-2" />

                <CardFooter className="mt-auto flex items-center justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                  <CategoryCreateUpdate
                    mode="edit"
                    trigger="Edit"
                    defaultValues={category}
                    onSave={handleUpdate}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleteCategory.isPending}
                    onClick={() => void handleDelete(category.id)}
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
