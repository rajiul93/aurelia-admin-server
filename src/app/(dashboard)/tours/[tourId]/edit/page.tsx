"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useTour } from "@/hooks/queries/use-tours";
import { cn } from "@/lib/utils";
import { TourBundlePanel } from "../../tour-bundle-panel";
import { TourForm } from "../../tour-form";
import { TourLifecyclePanel } from "../../tour-lifecycle-panel";

function EditTourContentSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-xl" />
    </div>
  );
}

export default function EditTourPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;

  const { data, isLoading } = useTour(tourId);
  const tour = data?.data;

  if (isLoading || !tour) {
    return <EditTourContentSkeleton />;
  }

  return (
    <div
      className={cn(
        "grid items-start gap-6",
        "xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]",
      )}
    >
      <aside className="space-y-6 xl:sticky xl:top-6">
        <TourLifecyclePanel
          tourId={tourId}
          tourBundleVersion={tour.tourBundleVersion}
        />
        <TourBundlePanel tourId={tourId} publishStatus={tour.publishStatus} />
      </aside>

      <TourForm mode="edit" defaultValues={tour} />
    </div>
  );
}
