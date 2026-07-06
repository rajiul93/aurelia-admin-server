"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTour } from "@/hooks/queries/use-tours";
import { TourBundlePanel } from "../../tour-bundle-panel";
import { TourForm } from "../../tour-form";
import { TourLifecyclePanel } from "../../tour-lifecycle-panel";

export default function EditTourPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;

  const { data, isLoading, isError, error } = useTour(tourId);
  const tour = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !tour) {
    return (
      <div className="space-y-4">
        <p className="font-medium">Could not load tour</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Tour not found."}
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/tours" />}>
          Back to tours
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Tour</h1>
        <p className="text-muted-foreground text-sm">
          Update tour metadata here. Use the publish workflow panel for status
          changes.
        </p>
      </div>
      <TourLifecyclePanel
        tourId={tourId}
        tourBundleVersion={tour.tourBundleVersion}
      />
      <TourBundlePanel tourId={tourId} publishStatus={tour.publishStatus} />
      <TourForm mode="edit" defaultValues={tour} />
    </div>
  );
}
