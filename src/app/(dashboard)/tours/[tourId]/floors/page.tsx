"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ImageIcon,
  Layers,
  Loader2,
  Route,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useFloors } from "@/hooks/queries/use-floors";
import { useDeleteFloor } from "@/hooks/mutations/use-floor-mutations";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { getPreferredAudienceTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Floor } from "@/types/floor";
import { FloorFormDialog } from "./floor-form-dialog";
import { TransitionPointsDialog } from "./transition-points-dialog";

function floorName(floor: Floor) {
  return getPreferredAudienceTranslation(floor.translations)?.name ?? null;
}

function FloorLocaleChips({
  translations,
}: {
  translations: Floor["translations"];
}) {
  const filledByLang = useMemo(() => {
    const set = new Set<string>();
    for (const entry of translations) {
      if (entry.name?.trim()) {
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

function FloorsTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden p-0 py-0">
      <CardContent className="p-0 pt-0">
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="size-12 rounded-lg" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TourFloorsPage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;

  const { data: floorsResponse, isLoading, isError, error, refetch } =
    useFloors(tourId);
  const deleteFloor = useDeleteFloor(tourId);
  const askConfirm = useConfirm();

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const floors = useMemo(() => {
    return [...(floorsResponse?.data ?? [])].sort(
      (a, b) => a.floorNo - b.floorNo,
    );
  }, [floorsResponse?.data]);

  const nextFloorNo = floors.length
    ? Math.max(...floors.map((floor) => floor.floorNo)) + 1
    : 1;

  async function handleDelete(floor: Floor) {
    setDeleteError(null);

    const label = floorName(floor) ?? `Floor ${floor.floorNo}`;
    const confirmed = await askConfirm({
      title: `Delete ${label}?`,
      description:
        floor.spotCount > 0
          ? `Its ${floor.spotCount} spot(s) and its route will be deleted too. This cannot be undone.`
          : "This cannot be undone.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(floor.id);

    try {
      await deleteFloor.mutateAsync(floor.id);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "Could not delete floor."));
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
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

      {isLoading ? <FloorsTableSkeleton /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load floors</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && floors.length === 0 ? (
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Layers className="text-muted-foreground size-10" />
            <p className="font-medium">No floors yet</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Add the first floor to start placing spots and building routes.
            </p>
            <FloorFormDialog
              tourId={tourId}
              mode="create"
              nextFloorNo={nextFloorNo}
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && floors.length > 0 ? (
        <Card className="gap-0 overflow-hidden p-0 py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Cover
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    #
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Name
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Spots
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Route
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Transitions
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
                {floors.map((floor, rowIndex) => {
                  const name = floorName(floor);
                  const isDeleting = pendingDeleteId === floor.id;

                  return (
                    <tr
                      key={floor.id}
                      className={cn(
                        "transition-colors hover:bg-brand-cream/35",
                        rowIndex % 2 === 1 && "bg-muted/15",
                      )}
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="bg-muted size-14 overflow-hidden rounded-lg ring-1 ring-border/60">
                          {floor.coverMedia?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={floor.coverMedia.url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <ImageIcon className="text-muted-foreground size-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <Badge
                          variant="outline"
                          className="border-brand-tan/50 bg-brand-cream/50 text-brand-deep font-mono tabular-nums"
                        >
                          {floor.floorNo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-semibold leading-snug tracking-tight">
                          {name ?? (
                            <span className="text-muted-foreground font-normal italic">
                              Floor {floor.floorNo}
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Sort {floor.sortOrder}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle tabular-nums">
                        {floor.spotCount}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle tabular-nums">
                        {floor.routeEdgeCount}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle tabular-nums">
                        {floor.transitionPoints.length}
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <FloorLocaleChips translations={floor.translations} />
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
                                href={`/tours/${tourId}/route?floorId=${floor.id}`}
                              />
                            }
                            title="Open route editor"
                          >
                            <Route className="size-3.5" />
                            Route
                          </Button>
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
                            variant="destructive"
                            size="sm"
                            className="h-8"
                            disabled={isDeleting}
                            onClick={() => void handleDelete(floor)}
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
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="size-3" />
              {floors.length} floor{floors.length === 1 ? "" : "s"} · sorted by
              floor number
            </p>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}
