"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getTourWorkspaceSectionLabel,
  TourWorkspaceHeader,
  TourWorkspaceHeaderSkeleton,
} from "@/components/tours/tour-workspace-header";
import { useTour } from "@/hooks/queries/use-tours";

export function TourWorkspaceShell({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const pathname = usePathname();
  const { data, isLoading, isError, error } = useTour(tourId);

  const tour = data?.data;
  const sectionLabel = getTourWorkspaceSectionLabel(pathname, tourId);

  return (
    <div className="space-y-8">
      {isLoading ? <TourWorkspaceHeaderSkeleton /> : null}
      {!isLoading && isError ? (
        <Card className="border-destructive/40 shadow-md">
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <p className="font-medium">Could not load tour</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Tour not found."}
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/tours" />}
            >
              <ChevronLeft className="size-4" />
              Back to tours
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {!isLoading && tour ? (
        <TourWorkspaceHeader
          tourId={tourId}
          tour={tour}
          sectionLabel={sectionLabel}
        />
      ) : null}
      {children}
    </div>
  );
}
