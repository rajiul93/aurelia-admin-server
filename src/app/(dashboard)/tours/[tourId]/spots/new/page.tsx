"use client";

import { useParams } from "next/navigation";
import { SpotForm } from "../spot-form";

export default function NewSpotPage() {
  const params = useParams<{ tourId: string }>();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Add spot</h1>
        <p className="text-muted-foreground text-sm">
          Spot content only. Media and FAQs are managed on separate pages after
          saving.
        </p>
      </div>
      <SpotForm tourId={params.tourId} mode="create" />
    </div>
  );
}
