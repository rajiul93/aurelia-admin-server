"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDeleteSpot } from "@/hooks/mutations/use-spot-mutations";
import { useSpots } from "@/hooks/queries/use-spots";
import { useTour } from "@/hooks/queries/use-tours";
import { getPreferredTranslation } from "@/lib/i18n/translations";

export default function TourSpotsPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const { data: tourResponse } = useTour(tourId);
  const { data, isLoading, isError } = useSpots(tourId);
  const deleteSpot = useDeleteSpot(tourId);
  const askConfirm = useConfirm();

  const tour = tourResponse?.data;
  const spots = data?.data ?? [];

  async function handleDelete(spotId: string) {
    const confirmed = await askConfirm({
      title: "Delete this spot?",
      description: "Its media and FAQs will be deleted too.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    await deleteSpot.mutateAsync(spotId);
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
            {" / Spots"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Spots</h1>
          <p className="text-muted-foreground text-sm">
            Manage stops separately. Add media and FAQs on each spot&apos;s own
            pages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/tours/${tourId}/route`} />}
          >
            Route
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/tours/${tourId}/spots/new`} />}
          >
            <Plus className="size-4" />
            Add spot
          </Button>
        </div>
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : null}

      {isError ? (
        <Card>
          <CardContent className="py-10">Could not load spots.</CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && spots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="font-medium">No spots yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add the first stop for this tour.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {spots.map((spot) => {
          const preferred = getPreferredTranslation(spot.translations);

          return (
            <Card key={spot.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  #{spot.sortOrder} — {preferred?.title ?? "Untitled spot"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {spot.medias.length} media · {spot.faqs.length} FAQs
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/20 px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/tours/${tourId}/spots/${spot.id}/edit`} />}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/tours/${tourId}/spots/${spot.id}/media`} />}
                >
                  Media
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/tours/${tourId}/spots/${spot.id}/faqs`} />}
                >
                  FAQs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void handleDelete(spot.id)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
