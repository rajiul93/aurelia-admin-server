"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  ImageIcon,
  Layers,
  Loader2,
  MapPin,
  MessageCircleQuestion,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDeleteSpot } from "@/hooks/mutations/use-spot-mutations";
import { useFloors } from "@/hooks/queries/use-floors";
import { useSpots } from "@/hooks/queries/use-spots";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import {
  getPreferredAudienceTranslation,
} from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Floor } from "@/types/floor";
import type { Spot } from "@/types/spot";

function formatCoords(lat: number | null, lng: number | null) {
  if (lat == null || lng == null) {
    return "—";
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function SpotLocaleChips({ translations }: { translations: Spot["translations"] }) {
  const filledByLang = useMemo(() => {
    const set = new Set<string>();
    for (const entry of translations) {
      if (entry.title?.trim()) {
        set.add(entry.language);
      }
    }
    return set;
  }, [translations]);

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {APP_LANGUAGES.map((lang) => {
        const filled = filledByLang.has(lang);
        return (
          <span
            key={lang}
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
              filled
                ? "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/25 dark:text-emerald-200"
                : "bg-muted/80 text-muted-foreground ring-1 ring-border/60",
            )}
          >
            {lang}
          </span>
        );
      })}
    </div>
  );
}

function SpotsTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden p-0 py-0">
      <CardContent className="p-0 pt-0">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const ALL_FLOORS_FILTER = "all";

function floorFilterLabel(floor: Pick<Floor, "floorNo" | "translations">) {
  const name = getPreferredAudienceTranslation(floor.translations)?.name;
  return name ? `${floor.floorNo}. ${name}` : `Floor ${floor.floorNo}`;
}

export default function TourSpotsPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const floorIdFromUrl = searchParams.get("floorId");

  const { data, isLoading, isError, error, refetch } = useSpots(tourId);
  const { data: floorsResponse } = useFloors(tourId);
  const deleteSpot = useDeleteSpot(tourId);
  const askConfirm = useConfirm();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const floors = useMemo(
    () =>
      [...(floorsResponse?.data ?? [])].sort((a, b) => a.floorNo - b.floorNo),
    [floorsResponse?.data],
  );

  const floorFilter = useMemo(() => {
    if (!floorIdFromUrl || floorIdFromUrl === ALL_FLOORS_FILTER) {
      return ALL_FLOORS_FILTER;
    }
    if (floors.some((floor) => floor.id === floorIdFromUrl)) {
      return floorIdFromUrl;
    }
    return ALL_FLOORS_FILTER;
  }, [floorIdFromUrl, floors]);

  const setFloorFilter = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === ALL_FLOORS_FILTER) {
        next.delete("floorId");
      } else {
        next.set("floorId", value);
      }
      const query = next.toString();
      router.replace(
        `/tours/${tourId}/spots${query ? `?${query}` : ""}`,
        { scroll: false },
      );
    },
    [router, searchParams, tourId],
  );

  const spots = useMemo(() => {
    return [...(data?.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [data?.data]);

  const floorNoById = useMemo(() => {
    const map = new Map<string, number>();
    for (const floor of floors) {
      map.set(floor.id, floor.floorNo);
    }
    return map;
  }, [floors]);

  const floorLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const floor of floors) {
      map.set(floor.id, floorFilterLabel(floor));
    }
    return map;
  }, [floors]);

  const spotCountByFloorId = useMemo(() => {
    const map = new Map<string, number>();
    for (const spot of spots) {
      map.set(spot.floorId, (map.get(spot.floorId) ?? 0) + 1);
    }
    return map;
  }, [spots]);

  const filteredSpots = useMemo(() => {
    let list =
      floorFilter === ALL_FLOORS_FILTER
        ? spots
        : spots.filter((spot) => spot.floorId === floorFilter);

    if (floorFilter === ALL_FLOORS_FILTER && floors.length > 1) {
      list = [...list].sort((a, b) => {
        const floorA = floorNoById.get(a.floorId) ?? 0;
        const floorB = floorNoById.get(b.floorId) ?? 0;
        if (floorA !== floorB) {
          return floorA - floorB;
        }
        return a.sortOrder - b.sortOrder;
      });
    }

    return list;
  }, [spots, floorFilter, floors.length, floorNoById]);

  async function handleDelete(spotId: string) {
    const confirmed = await askConfirm({
      title: "Delete this spot?",
      description: "Its media and FAQs will be deleted too.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(spotId);
    try {
      await deleteSpot.mutateAsync(spotId);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {floors.length > 0 ? (
          <div className="space-y-2">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
              <Layers className="size-3.5" />
              Floor
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={
                  floorFilter === ALL_FLOORS_FILTER ? "default" : "outline"
                }
                className={cn(
                  floorFilter !== ALL_FLOORS_FILTER &&
                    "border-brand-tan/60 bg-background",
                )}
                onClick={() => setFloorFilter(ALL_FLOORS_FILTER)}
              >
                All
                <Badge variant="secondary" className="ml-1 tabular-nums">
                  {spots.length}
                </Badge>
              </Button>
              {floors.map((floor) => {
                const active = floorFilter === floor.id;
                const count = spotCountByFloorId.get(floor.id) ?? 0;
                return (
                  <Button
                    key={floor.id}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    className={cn(
                      !active && "border-brand-tan/60 bg-background",
                    )}
                    onClick={() => setFloorFilter(floor.id)}
                  >
                    {floorFilterLabel(floor)}
                    <Badge variant="secondary" className="ml-1 tabular-nums">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          <div />
        )}
        <Button
          className="shrink-0 self-end sm:self-auto"
          nativeButton={false}
          render={<Link href={`/tours/${tourId}/spots/new`} />}
        >
          <Plus className="size-4" />
          Add spot
        </Button>
      </div>

      {isLoading ? <SpotsTableSkeleton /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load spots</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && spots.length === 0 ? (
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <MapPin className="text-muted-foreground size-10" />
            <p className="font-medium">No spots yet</p>
            <p className="text-muted-foreground text-sm">
              Add the first stop for this tour.
            </p>
            <Button
              className="mt-2"
              nativeButton={false}
              render={<Link href={`/tours/${tourId}/spots/new`} />}
            >
              <Plus className="size-4" />
              Add spot
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading &&
      !isError &&
      spots.length > 0 &&
      filteredSpots.length === 0 ? (
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Layers className="text-muted-foreground size-10" />
            <p className="font-medium">No spots on this floor</p>
            <p className="text-muted-foreground text-sm">
              Try another floor or show all spots.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFloorFilter(ALL_FLOORS_FILTER)}
            >
              Show all spots
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && filteredSpots.length > 0 ? (
        <Card className="gap-0 overflow-hidden p-0 py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    #
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Spot
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Floor
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Coordinates
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Quick
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Media
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    FAQs
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Locales
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-right text-xs font-semibold tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filteredSpots.map((spot, rowIndex) => {
                  const preferred = getPreferredAudienceTranslation(
                    spot.translations,
                  );
                  const isDeleting = pendingDeleteId === spot.id;
                  const floorLabel =
                    floorLabelById.get(spot.floorId) ?? "—";

                  return (
                    <tr
                      key={spot.id}
                      className={cn(
                        "transition-colors hover:bg-brand-cream/35",
                        rowIndex % 2 === 1 && "bg-muted/15",
                      )}
                    >
                      <td className="text-muted-foreground px-4 py-3.5 text-center align-middle font-mono text-xs tabular-nums">
                        {spot.sortOrder}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="max-w-xs font-semibold leading-snug tracking-tight">
                          {preferred?.title ?? (
                            <span className="text-muted-foreground font-normal italic">
                              Untitled spot
                            </span>
                          )}
                        </p>
                        {preferred?.shortDesc ? (
                          <p className="text-muted-foreground mt-0.5 line-clamp-1 max-w-md text-xs">
                            {preferred.shortDesc}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <Badge
                          variant="outline"
                          className="border-brand-tan/50 bg-brand-cream/40 text-brand-deep max-w-[140px] truncate font-normal"
                          title={floorLabel}
                        >
                          {floorLabel}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground px-4 py-3.5 align-middle font-mono text-[11px] whitespace-nowrap">
                        {formatCoords(spot.latitude, spot.longitude)}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        {spot.includedInQuickTour ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold text-amber-950 ring-1 ring-amber-500/30 dark:text-amber-100">
                            <Zap className="size-3" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="inline-flex items-center justify-center gap-1 text-xs font-medium tabular-nums">
                          <ImageIcon className="text-primary size-3.5" />
                          {spot.medias.length}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <span className="inline-flex items-center justify-center gap-1 text-xs font-medium tabular-nums">
                          <MessageCircleQuestion className="text-primary size-3.5" />
                          {spot.faqs.length}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <SpotLocaleChips translations={spot.translations} />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-brand-tan/70 h-8"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/tours/${tourId}/spots/${spot.id}/edit`}
                              />
                            }
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-brand-tan/70 h-8"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/tours/${tourId}/spots/${spot.id}/media`}
                              />
                            }
                          >
                            Media
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-brand-tan/70 h-8"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/tours/${tourId}/spots/${spot.id}/faqs`}
                              />
                            }
                          >
                            FAQs
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            disabled={deleteSpot.isPending}
                            onClick={() => void handleDelete(spot.id)}
                          >
                            {isDeleting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <CardFooter className="border-brand-tan/40 bg-brand-cream/25 flex-col items-start gap-0 border-t px-4 py-2.5">
            <p className="text-muted-foreground text-xs">
              {floorFilter === ALL_FLOORS_FILTER
                ? `${filteredSpots.length} spot${filteredSpots.length === 1 ? "" : "s"}`
                : `${filteredSpots.length} of ${spots.length} spot${spots.length === 1 ? "" : "s"}`}
              {floorFilter === ALL_FLOORS_FILTER && floors.length > 1
                ? " · grouped by floor, then order"
                : " · sorted by order"}
            </p>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
