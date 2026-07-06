"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiKnowledge } from "@/hooks/queries/use-ai-knowledge";
import { AiKnowledgeForm } from "../../ai-knowledge-form";

export default function EditAiKnowledgePage() {
  const params = useParams<{ tourId: string; knowledgeId: string }>();
  const { data, isLoading, isError, error } = useAiKnowledge(
    params.tourId,
    params.knowledgeId,
  );
  const knowledge = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !knowledge) {
    return (
      <div className="space-y-4">
        <p className="font-medium">Could not load AI knowledge</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Entry not found."}
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/tours/${params.tourId}/ai-knowledge`} />}
        >
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link
            href={`/tours/${params.tourId}/ai-knowledge`}
            className="hover:underline"
          >
            AI Knowledge
          </Link>
          {" / Edit"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit AI Knowledge
        </h1>
      </div>
      <AiKnowledgeForm
        tourId={params.tourId}
        mode="edit"
        defaultValues={knowledge}
      />
    </div>
  );
}
