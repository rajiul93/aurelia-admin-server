"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTour } from "@/hooks/queries/use-tours";
import { useFloors } from "@/hooks/queries/use-floors";
import { getPreferredTranslation } from "@/lib/i18n/translations";

export default function TourFloorsPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const { data: tourResponse } = useTour(tourId);
  const { data: floorsResponse, isLoading } = useFloors(tourId);

  const tour = tourResponse?.data;
  const floors = floorsResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
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
              {getPreferredTranslation(tour?.translations ?? [])?.title ?? "Tour"}
            </Link>
            {" / Floors"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Floors</h1>
          <p className="text-muted-foreground text-sm">
            Multi-level indoor tours. Each floor has its own map, spots, and route.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Floor
        </Button>
      </div>

      {floors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No floors yet. Create the first floor to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {floors.map((floor: any) => (
            <Card key={floor.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">Floor {floor.floorNo}</CardTitle>
                      {floor.mapTileUrl && (
                        <p className="text-sm text-muted-foreground">Map: {floor.mapTileUrl.split("/").pop()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Spots</p>
                    <p className="font-semibold">{floor.spots?.length ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Route Edges</p>
                    <p className="font-semibold">{floor.route?.edges?.length ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
