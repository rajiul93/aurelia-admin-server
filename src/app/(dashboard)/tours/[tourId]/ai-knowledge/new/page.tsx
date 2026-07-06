"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTour } from "@/hooks/queries/use-tours";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import { AiKnowledgeForm } from "../ai-knowledge-form";

export default function NewAiKnowledgePage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const { data: tourResponse } = useTour(tourId);
  const tour = tourResponse?.data;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link
            href={`/tours/${tourId}/ai-knowledge`}
            className="hover:underline"
          >
            AI Knowledge
          </Link>
          {" / New"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Add AI Knowledge
        </h1>
        <p className="text-muted-foreground text-sm">
          {getPreferredTranslation(tour?.translations ?? [])?.title ?? "Tour"} —
          plain-text corpus for grounded answers.
        </p>
      </div>
      <AiKnowledgeForm tourId={tourId} mode="create" />
    </div>
  );
}
