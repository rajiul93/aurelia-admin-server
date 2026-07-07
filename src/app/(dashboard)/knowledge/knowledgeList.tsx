"use client";

import { useState } from "react";
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
import { FaqAnswer } from "@/components/faq/faq-answer";
import {
  useCreateKnowledgeArticle,
  useDeleteKnowledgeArticle,
  useUpdateKnowledgeArticle,
} from "@/hooks/mutations/use-knowledge-article-mutations";
import { useKnowledgeArticles } from "@/hooks/queries/use-knowledge-articles";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import type { KnowledgeCategory } from "@/types/knowledge-article";
import KnowledgeCreateUpdate from "./knowledgeCreateUpdate";

type Filter = "ALL" | KnowledgeCategory;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "Knowledge Base", value: "KNOWLEDGE" },
  { label: "Info Pages", value: "INFO_PAGE" },
  { label: "Legal", value: "LEGAL" },
];

const CATEGORY_LABEL: Record<KnowledgeCategory, string> = {
  KNOWLEDGE: "Knowledge",
  INFO_PAGE: "Info Page",
  LEGAL: "Legal",
};

export function KnowledgeList() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data, isLoading, isError, error, refetch } = useKnowledgeArticles({
    page: 1,
    limit: 100,
    ...(filter === "ALL" ? {} : { category: filter }),
  });
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const deleteArticle = useDeleteKnowledgeArticle();

  const articles = data?.data ?? [];

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Delete this content? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }
    await deleteArticle.mutateAsync(id);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">
            Knowledge & app pages
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Knowledge Base entries feed the Aurelia Assistant. Info & Legal
            pages appear in the app&apos;s side menu. All content is stored in
            English, Spanish, and French.
          </p>
        </div>
        <KnowledgeCreateUpdate
          mode="create"
          trigger="Create New"
          defaultCategory={filter === "ALL" ? "KNOWLEDGE" : filter}
          onSave={async (values) => {
            await createArticle.mutateAsync({
              key: values.key,
              category: values.category,
              includeInAssistant: values.includeInAssistant,
              sortOrder: values.sortOrder,
              icon: values.icon || undefined,
              translations: values.translations,
            });
          }}
        />
      </div>

      <div className="bg-muted inline-flex flex-wrap gap-1 rounded-lg p-1">
        {FILTERS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => setFilter(entry.value)}
            className={
              entry.value === filter
                ? "bg-background text-foreground rounded-md px-3 py-1.5 text-sm font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium"
            }
          >
            {entry.label}
          </button>
        ))}
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
            <p className="font-medium">Could not load content</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && articles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No content yet</p>
            <p className="text-muted-foreground text-sm">
              Create knowledge-base entries or app pages to get started.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && articles.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => {
            const preferred = getPreferredTranslation(article.translations);

            return (
              <Card
                key={article.id}
                className="flex h-full flex-col border border-border/80 shadow-sm"
              >
                <CardHeader className="space-y-4 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {CATEGORY_LABEL[article.category]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {article.key}
                    </Badge>
                    {article.category === "KNOWLEDGE" &&
                    article.includeInAssistant ? (
                      <Badge variant="outline" className="text-[10px]">
                        Assistant
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="text-base leading-snug font-semibold tracking-tight">
                    {preferred?.title ?? "Untitled"}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  <FaqAnswer
                    answerHtml={preferred?.bodyHtml ?? ""}
                    answerText={preferred?.bodyText ?? ""}
                    className="line-clamp-5"
                  />
                </CardContent>

                <CardFooter className="mt-auto flex items-center justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                  <KnowledgeCreateUpdate
                    mode="edit"
                    trigger="Edit"
                    defaultValues={article}
                    onSave={async (values) => {
                      if (!values.id) {
                        return;
                      }
                      await updateArticle.mutateAsync({
                        id: values.id,
                        payload: {
                          key: values.key,
                          category: values.category,
                          includeInAssistant: values.includeInAssistant,
                          sortOrder: values.sortOrder,
                          icon: values.icon || undefined,
                          translations: values.translations,
                        },
                      });
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleteArticle.isPending}
                    onClick={() => void handleDelete(article.id)}
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
