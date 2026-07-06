"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { useDeleteAiKnowledge } from "@/hooks/mutations/use-ai-knowledge-mutations";
import { useAiKnowledgeList } from "@/hooks/queries/use-ai-knowledge";
import { useTour } from "@/hooks/queries/use-tours";
import {
  getPreferredAudienceTranslation,
  getPreferredTranslation,
} from "@/lib/i18n/translations";

export default function AiKnowledgeListPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const { data: tourResponse } = useTour(tourId);
  const { data, isLoading, isError, error, refetch } =
    useAiKnowledgeList(tourId);
  const deleteKnowledge = useDeleteAiKnowledge(tourId);

  const tour = tourResponse?.data;
  const records = data?.data ?? [];

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete AI knowledge "${title}"?`)) {
      return;
    }

    await deleteKnowledge.mutateAsync(id);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link href="/tours" className="hover:underline">
            Tours
          </Link>
          {" / "}
          <Link href={`/tours/${tourId}/edit`} className="hover:underline">
            {getPreferredTranslation(tour?.translations ?? [])?.title ?? "Tour"}
          </Link>
          {" / AI Knowledge"}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              AI Knowledge
            </h1>
            <p className="text-muted-foreground text-sm">
              Grounded corpus for offline AI. Answers may only use this content
              plus spot FAQs and descriptions.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href={`/tours/${tourId}/ai-knowledge/new`} />}
          >
            <Plus className="size-4" />
            Add entry
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load AI knowledge</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No AI knowledge yet</p>
            <p className="text-muted-foreground text-sm">
              Add plain-text facts the chat may retrieve offline.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length > 0 ? (
        <div className="grid gap-4">
          {records.map((entry) => {
            const preferred = getPreferredAudienceTranslation(entry.translations);
            const title = preferred?.title || preferred?.content.slice(0, 80) || "Untitled";

            return (
              <Card key={entry.id}>
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">#{entry.sortOrder}</Badge>
                    <Badge variant="secondary">
                      {entry.spot
                        ? `Spot: ${entry.spot.title}`
                        : "Tour-level"}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {preferred?.content}
                  </p>
                  {preferred?.keywords ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Keywords: {preferred.keywords}
                    </p>
                  ) : null}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/tours/${tourId}/ai-knowledge/${entry.id}/edit`}
                      />
                    }
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleteKnowledge.isPending}
                    onClick={() => void handleDelete(entry.id, title)}
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
