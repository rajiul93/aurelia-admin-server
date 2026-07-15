"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Layers, Loader2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTour } from "@/hooks/queries/use-tours";
import { useFloors } from "@/hooks/queries/use-floors";
import { useDeleteFloor } from "@/hooks/mutations/use-floor-mutations";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { getPreferredAudienceTranslation } from "@/lib/i18n/translations";
import type { Floor } from "@/types/floor";
import { FloorFormDialog } from "./floor-form-dialog";
import { TransitionPointsDialog } from "./transition-points-dialog";

function floorName(floor: Floor) {
  return getPreferredAudienceTranslation(floor.translations)?.name ?? null;
}

export default function TourFloorsPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;

  const { data: tourResponse } = useTour(tourId);
  const { data: floorsResponse, isLoading } = useFloors(tourId);
  const deleteFloor = useDeleteFloor(tourId);

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const tour = tourResponse?.data;
  const floors = floorsResponse?.data ?? [];
  const tourTitle =
    getPreferredAudienceTranslation(tour?.translations ?? [])?.title ?? "Tour";

  const nextFloorNo = floors.length
    ? Math.max(...floors.map((floor) => floor.floorNo)) + 1
    : 1;

  async function handleDelete(floor: Floor) {
    setDeleteError(null);

    const label = floorName(floor) ?? `Floor ${floor.floorNo}`;
    const confirmed = window.confirm(
      floor.spotCount > 0
        ? `Delete ${label}? Its ${floor.spotCount} spot(s) and its route will be deleted too. This cannot be undone.`
        : `Delete ${label}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(floor.id);

    try {
      await deleteFloor.mutateAsync(floor.id);
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, "Could not delete floor."));
    } finally {
      setPendingDeleteId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            <Link href="/tours" className="hover:underline">
              Tours
            </Link>
            {" / "}
            <Link href={`/tours/${tourId}/edit`} className="hover:underline">
              {tourTitle}
            </Link>
            {" / Floors"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Floors</h1>
          <p className="text-muted-foreground text-sm">
            Each floor carries its own map, spots, and route. Visitors switch
            between them in the app.
          </p>
        </div>
        <FloorFormDialog
          tourId={tourId}
          mode="create"
          nextFloorNo={nextFloorNo}
        />
      </div>

      {deleteError ? (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      ) : null}

      {floors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <Layers className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-center text-sm">
              No floors yet. Add the first floor to start placing spots.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {floors.map((floor) => {
            const name = floorName(floor);
            const isDeleting = pendingDeleteId === floor.id;

            return (
              <Card key={floor.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">
                        Floor {floor.floorNo}
                        {name ? ` — ${name}` : ""}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        {floor.spotCount} spot{floor.spotCount === 1 ? "" : "s"}
                        {" · "}
                        {floor.routeEdgeCount} route edge
                        {floor.routeEdgeCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <TransitionPointsDialog
                        tourId={tourId}
                        floor={floor}
                        allFloors={floors}
                      />
                      <FloorFormDialog
                        tourId={tourId}
                        mode="edit"
                        floor={floor}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled={isDeleting}
                        onClick={() => handleDelete(floor)}
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Spots</p>
                      <p className="font-semibold">{floor.spotCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Route edges</p>
                      <p className="font-semibold">{floor.routeEdgeCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transitions</p>
                      <p className="font-semibold">
                        {floor.transitionPoints.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
