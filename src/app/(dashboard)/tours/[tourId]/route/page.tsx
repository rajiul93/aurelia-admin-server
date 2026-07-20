"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Circle,
  Footprints,
  Layers,
  Loader2,
  MapPin,
  Trash2,
  Wand2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useDeleteRouteEdge,
  useGenerateRouteFootprints,
  useGenerateTourRoute,
} from "@/hooks/mutations/use-tour-route-mutations";
import { useFloors } from "@/hooks/queries/use-floors";
import { useSpots } from "@/hooks/queries/use-spots";
import { useTourRoute } from "@/hooks/queries/use-tour-route";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { getPreferredAudienceTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { RouteEdge } from "@/types/tour-route";
import { AddRouteEdgeDialog } from "./add-route-edge-dialog";
import { RouteMapPreview } from "./route-map-preview";

function footprintStatus(edge: RouteEdge) {
  if (edge.footprintGeo && edge.footprintGeo.length >= 2) {
    return {
      label: `${edge.footprintGeo.length} pts`,
      detail: "Walking path",
      className:
        "bg-emerald-500/12 text-emerald-900 ring-emerald-500/25 dark:text-emerald-200",
    };
  }
  return {
    label: "Straight line",
    detail: "Run Generate footprints",
    className: "bg-amber-500/12 text-amber-950 ring-amber-500/25 dark:text-amber-100",
  };
}

function RouteTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden p-0 py-0">
      <CardContent className="p-0 pt-0">
        <div className="divide-y">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-8 w-10" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TourRoutePage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const floorIdFromUrl = searchParams.get("floorId");

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: floorsResponse, isLoading: floorsLoading } = useFloors(tourId);
  const { data: spotsResponse, isLoading: spotsLoading } = useSpots(tourId);

  const floors = useMemo(
    () =>
      [...(floorsResponse?.data ?? [])].sort((a, b) => a.floorNo - b.floorNo),
    [floorsResponse?.data],
  );

  const selectedFloorId = useMemo(() => {
    if (
      floorIdFromUrl &&
      floors.some((floor) => floor.id === floorIdFromUrl)
    ) {
      return floorIdFromUrl;
    }
    return floors[0]?.id ?? "";
  }, [floorIdFromUrl, floors]);

  const selectFloor = useCallback(
    (floorId: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("floorId", floorId);
      router.replace(`/tours/${tourId}/route?${next.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams, tourId],
  );

  const { data: routeResponse, isLoading: routeLoading, isError, error } =
    useTourRoute(tourId, selectedFloorId);

  const askConfirm = useConfirm();
  const deleteEdge = useDeleteRouteEdge(tourId, selectedFloorId);
  const generateRoute = useGenerateTourRoute(tourId, selectedFloorId);
  const generateFootprints = useGenerateRouteFootprints(tourId, selectedFloorId);

  const edges = useMemo(
    () =>
      [...(routeResponse?.data?.edges ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    [routeResponse?.data?.edges],
  );

  const spots = useMemo(
    () =>
      [...(spotsResponse?.data ?? [])]
        .filter((spot) => spot.floorId === selectedFloorId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [spotsResponse?.data, selectedFloorId],
  );

  const spotsWithCoords = spots.filter(
    (spot) => spot.latitude != null && spot.longitude != null,
  ).length;

  const edgesWithFootprints = edges.filter(
    (edge) => edge.footprintGeo && edge.footprintGeo.length >= 2,
  ).length;

  const hasFloors = floors.length > 0;
  const isLoading = floorsLoading || spotsLoading || routeLoading;

  const stepSpotsDone = spots.length >= 2;
  const stepRouteDone = edges.length > 0;
  const stepFootprintsDone =
    edges.length > 0 && edgesWithFootprints === edges.length;

  function floorShortLabel(floor: (typeof floors)[number]) {
    const name = getPreferredAudienceTranslation(floor.translations)?.name;
    return name ? `${floor.floorNo}. ${name}` : `Floor ${floor.floorNo}`;
  }

  async function handleGenerate() {
    setSubmitError(null);

    const confirmed = await askConfirm({
      title: "Build route from spots?",
      description:
        "Creates a chain of edges in spot sort order and replaces any existing edges on this floor.",
      confirmLabel: "Build route",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      await generateRoute.mutateAsync();
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err, "Could not generate route."),
      );
    }
  }

  async function handleGenerateFootprints() {
    setSubmitError(null);

    const confirmed = await askConfirm({
      title: "Generate walking footprints?",
      description:
        "OSRM routes each edge between spot coordinates. This may take a moment.",
      confirmLabel: "Generate",
    });

    if (!confirmed) {
      return;
    }

    try {
      await generateFootprints.mutateAsync();
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err, "Could not generate footprints."),
      );
    }
  }

  async function handleDelete(edgeId: string) {
    const confirmed = await askConfirm({
      title: "Delete this route edge?",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setSubmitError(null);
    setPendingDeleteId(edgeId);

    try {
      await deleteEdge.mutateAsync(edgeId);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Could not delete route edge."));
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {!floorsLoading && !hasFloors ? (
        <Alert>
          <AlertDescription>
            Create a floor before building a route.{" "}
            <Link
              href={`/tours/${tourId}/floors`}
              className="font-medium underline"
            >
              Go to Floors
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {hasFloors ? (
        <Card className="gap-0 overflow-hidden p-0 py-0 shadow-md ring-1 ring-border/80">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                  <Layers className="size-3.5" />
                  Floor
                </p>
                <div className="flex flex-wrap gap-2">
                  {floors.map((floor) => {
                    const active = floor.id === selectedFloorId;
                    return (
                      <Button
                        key={floor.id}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className={cn(
                          !active && "border-brand-tan/60 bg-background",
                        )}
                        onClick={() => selectFloor(floor.id)}
                      >
                        {floorShortLabel(floor)}
                        <Badge
                          variant="secondary"
                          className="ml-1 tabular-nums"
                        >
                          {floor.id === selectedFloorId
                            ? edges.length
                            : floor.routeEdgeCount}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/tours/${tourId}/spots`} />}
                >
                  <MapPin className="size-4" />
                  Manage spots
                </Button>
                <AddRouteEdgeDialog
                  tourId={tourId}
                  floorId={selectedFloorId}
                  spots={spots}
                  edgeCount={edges.length}
                  disabled={spots.length < 2}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={generateRoute.isPending || spots.length < 2}
                  onClick={() => void handleGenerate()}
                >
                  {generateRoute.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Wand2 className="size-4" />
                  )}
                  Generate from spots
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={
                    generateFootprints.isPending || edges.length === 0
                  }
                  onClick={() => void handleGenerateFootprints()}
                >
                  {generateFootprints.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Footprints className="size-4" />
                  )}
                  Generate footprints
                </Button>
              </div>
            </div>

            <div className="border-brand-tan/40 bg-brand-cream/20 grid gap-3 rounded-lg border p-3 sm:grid-cols-3">
              <WorkflowStep
                done={stepSpotsDone}
                title="1. Spots on this floor"
                description={
                  stepSpotsDone
                    ? `${spots.length} spots (${spotsWithCoords} with map coords)`
                    : "Need at least 2 spots"
                }
                action={
                  !stepSpotsDone ? (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      nativeButton={false}
                      render={
                        <Link href={`/tours/${tourId}/spots/new`} />
                      }
                    >
                      Add spots
                    </Button>
                  ) : null
                }
              />
              <WorkflowStep
                done={stepRouteDone}
                title="2. Connect spots"
                description={
                  stepRouteDone
                    ? `${edges.length} edge${edges.length === 1 ? "" : "s"}`
                    : "Generate a chain or add edges"
                }
              />
              <WorkflowStep
                done={stepFootprintsDone}
                title="3. Walking paths"
                description={
                  stepRouteDone
                    ? `${edgesWithFootprints}/${edges.length} with OSRM footprints`
                    : "After edges exist"
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      {!stepFootprintsDone && stepRouteDone && edges.length > 0 ? (
        <Alert className="border-brand-tan/50 bg-brand-cream/30">
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Edges use straight lines until you generate footprints for
              realistic walking paths.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={generateFootprints.isPending}
              onClick={() => void handleGenerateFootprints()}
            >
              {generateFootprints.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Footprints className="size-4" />
              )}
              Generate now
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="lg:col-span-2 h-64 w-full rounded-xl" />
          <div className="lg:col-span-3">
            <RouteTableSkeleton />
          </div>
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="py-10">
            <p className="font-medium">Could not load route</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && hasFloors ? (
        <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
          <Card className="gap-0 overflow-hidden p-0 py-0 shadow-md ring-1 ring-border/80 lg:sticky lg:top-4 lg:col-span-2">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold tracking-tight">Map preview</p>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {spotsWithCoords}/{spots.length} spots on map
                </span>
              </div>
              <RouteMapPreview spots={spots} edges={edges} />
              <p className="text-muted-foreground text-xs">
                Numbers match spot sort order. Preview updates when you switch
                floors or edit edges.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-3">
            {edges.length === 0 ? (
              <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  <Wand2 className="text-muted-foreground size-10" />
                  <p className="font-medium">No route on this floor yet</p>
                  <p className="text-muted-foreground max-w-md text-sm">
                    {spots.length < 2
                      ? "Add at least two spots on this floor, then generate a route in one click."
                      : "Use Generate from spots to connect spots in sort order, or add edges manually."}
                  </p>
                  {spots.length >= 2 ? (
                    <Button
                      type="button"
                      disabled={generateRoute.isPending}
                      onClick={() => void handleGenerate()}
                    >
                      {generateRoute.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Wand2 className="size-4" />
                      )}
                      Generate from spots
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      nativeButton={false}
                      render={
                        <Link href={`/tours/${tourId}/spots/new`} />
                      }
                    >
                      <MapPin className="size-4" />
                      Add spots
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="gap-0 overflow-hidden p-0 py-0 shadow-md ring-1 ring-border/80">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                        <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                          #
                        </th>
                        <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                          From
                        </th>
                        <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                          To
                        </th>
                        <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                          Path
                        </th>
                        <th className="text-brand-deep px-4 py-3.5 text-right text-xs font-semibold tracking-wider uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {edges.map((edge, rowIndex) => {
                        const path = footprintStatus(edge);
                        const isDeleting = pendingDeleteId === edge.id;

                        return (
                          <tr
                            key={edge.id}
                            className={cn(
                              "transition-colors hover:bg-brand-cream/35",
                              rowIndex % 2 === 1 && "bg-muted/15",
                            )}
                          >
                            <td className="px-4 py-3.5 text-center align-middle">
                              <Badge
                                variant="outline"
                                className="border-brand-tan/50 font-mono tabular-nums"
                              >
                                {edge.sortOrder}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <span className="text-muted-foreground mr-1.5 font-mono text-xs">
                                {edge.fromSpot.sortOrder}.
                              </span>
                              {edge.fromSpot.title}
                            </td>
                            <td className="px-4 py-3.5 align-middle">
                              <span className="text-muted-foreground mr-1.5 font-mono text-xs">
                                {edge.toSpot.sortOrder}.
                              </span>
                              {edge.toSpot.title}
                            </td>
                            <td className="px-4 py-3.5 text-center align-middle">
                              <span
                                className={cn(
                                  "inline-flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-medium ring-1",
                                  path.className,
                                )}
                                title={path.detail}
                              >
                                {path.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right align-middle">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-8"
                                disabled={isDeleting}
                                onClick={() => void handleDelete(edge.id)}
                              >
                                {isDeleting ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                                Delete
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <CardFooter className="border-brand-tan/40 bg-brand-cream/25 border-t px-4 py-2.5">
                  <p className="text-muted-foreground text-xs">
                    {edges.length} edge{edges.length === 1 ? "" : "s"} on this
                    floor · changing edges bumps route version for the mobile app
                  </p>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WorkflowStep({
  done,
  title,
  description,
  action,
}: {
  done: boolean;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      {done ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      ) : (
        <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      )}
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-snug">{title}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {description}
        </p>
        {action}
      </div>
    </div>
  );
}
