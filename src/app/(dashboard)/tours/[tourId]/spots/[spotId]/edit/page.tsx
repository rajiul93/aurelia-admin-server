"use client";

import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpot } from "@/hooks/queries/use-spots";
import { SpotForm } from "../../spot-form";

export default function EditSpotPage() {
  const params = useParams<{ tourId: string; spotId: string }>();
  const { data, isLoading, isError } = useSpot(params.tourId, params.spotId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError || !data?.data) {
    return <p>Could not load spot.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit spot</h1>
      </div>
      <SpotForm tourId={params.tourId} mode="edit" defaultValues={data.data} />
    </div>
  );
}
