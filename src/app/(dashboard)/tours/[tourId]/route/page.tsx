"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Route, Trash2, Wand2, Footprints } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormInput, FormSelect, FormTextarea } from "@/components/form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateRouteEdge,
  useDeleteRouteEdge,
  useGenerateRouteFootprints,
  useGenerateTourRoute,
} from "@/hooks/mutations/use-tour-route-mutations";
import { useFloors } from "@/hooks/queries/use-floors";
import { useSpots } from "@/hooks/queries/use-spots";
import { useTourRoute } from "@/hooks/queries/use-tour-route";
import { useTour } from "@/hooks/queries/use-tours";
import {
  getPreferredAudienceTranslation,
  getPreferredTranslation,
} from "@/lib/i18n/translations";
import {
  parseFootprintText,
  routeEdgeFormSchema,
  type RouteEdgeFormInput,
} from "@/schemas/tour-route-form.schema";
import { RouteMapPreview } from "./route-map-preview";

export default function TourRoutePage() {
  const params = useParams<{ tourId: string }>();
  const tourId = params.tourId;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pickedFloorId, setPickedFloorId] = useState("");

  const { data: tourResponse } = useTour(tourId);
  const { data: floorsResponse, isLoading: floorsLoading } = useFloors(tourId);
  const { data: spotsResponse, isLoading: spotsLoading } = useSpots(tourId);

  const floors = useMemo(
    () => floorsResponse?.data ?? [],
    [floorsResponse?.data],
  );

  // Floors arrive after the first render, so fall back to the first one until
  // the user picks a floor themselves.
  const selectedFloorId = pickedFloorId || (floors[0]?.id ?? "");
  const setSelectedFloorId = setPickedFloorId;

  const { data: routeResponse, isLoading: routeLoading, isError, error } =
    useTourRoute(tourId, selectedFloorId);

  const createEdge = useCreateRouteEdge(tourId, selectedFloorId);
  const deleteEdge = useDeleteRouteEdge(tourId, selectedFloorId);
  const generateRoute = useGenerateTourRoute(tourId, selectedFloorId);
  const generateFootprints = useGenerateRouteFootprints(tourId, selectedFloorId);

  const tour = tourResponse?.data;
  const edges = routeResponse?.data?.edges ?? [];

  // A route only connects spots on its own floor — crossing floors is what a
  // transition point is for.
  const spots = useMemo(
    () =>
      (spotsResponse?.data ?? []).filter(
        (spot) => spot.floorId === selectedFloorId,
      ),
    [spotsResponse?.data, selectedFloorId],
  );

  const form = useForm<RouteEdgeFormInput>({
    resolver: zodResolver(routeEdgeFormSchema),
    defaultValues: {
      fromSpotId: "",
      toSpotId: "",
      sortOrder: edges.length,
      footprintText: "",
    },
  });

  const spotOptions = spots.map((spot) => {
    const title =
      getPreferredTranslation(spot.translations)?.title ??
      `Spot ${spot.sortOrder}`;

    return {
      label: `${spot.sortOrder}. ${title}`,
      value: spot.id,
    };
  });

  async function onSubmit(values: RouteEdgeFormInput) {
    setSubmitError(null);

    try {
      const footprintGeo = parseFootprintText(values.footprintText);
      await createEdge.mutateAsync({
        fromSpotId: values.fromSpotId,
        toSpotId: values.toSpotId,
        sortOrder: values.sortOrder,
        footprintGeo,
      });
      form.reset({
        fromSpotId: values.toSpotId,
        toSpotId: "",
        sortOrder: values.sortOrder + 1,
        footprintText: "",
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not add route edge.",
      );
    }
  }

  async function handleGenerate() {
    setSubmitError(null);

    if (
      !window.confirm(
        "Replace the current route with edges ordered by spot sort order?",
      )
    ) {
      return;
    }

    try {
      await generateRoute.mutateAsync();
      form.setValue("sortOrder", Math.max(spots.length - 1, 0));
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not generate route.",
      );
    }
  }

  async function handleGenerateFootprints() {
    setSubmitError(null);

    if (
      !window.confirm(
        "Generate walking footprints for every route edge using OSRM?",
      )
    ) {
      return;
    }

    try {
      await generateFootprints.mutateAsync();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not generate footprints.",
      );
    }
  }

  async function handleDelete(edgeId: string) {
    if (!window.confirm("Delete this route edge?")) {
      return;
    }

    setSubmitError(null);

    try {
      await deleteEdge.mutateAsync(edgeId);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not delete route edge.",
      );
    }
  }

  const isLoading = floorsLoading || spotsLoading || routeLoading;
  const hasFloors = floors.length > 0;

  function floorLabel(floor: (typeof floors)[number]) {
    const name = getPreferredAudienceTranslation(floor.translations)?.name;
    return name ? `Floor ${floor.floorNo} — ${name}` : `Floor ${floor.floorNo}`;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          <Link href="/tours" className="hover:underline">
            Tours
          </Link>
          {" / "}
          <Link href={`/tours/${tourId}/edit`} className="hover:underline">
            {getPreferredTranslation(tour?.translations ?? [])?.title ?? "Tour"}
          </Link>
          {" / Route"}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Route</h1>
            <p className="text-muted-foreground text-sm">
              Each floor has its own route. Edges connect spots on the selected
              floor; use a transition point to move between floors.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              render={<Link href={`/tours/${tourId}/spots`} />}
            >
              Spots
            </Button>
            <Button
              type="button"
              variant="outline"
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
              variant="outline"
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
      </div>

      {!floorsLoading && !hasFloors ? (
        <Alert>
          <AlertDescription>
            This tour has no floors yet.{" "}
            <Link
              href={`/tours/${tourId}/floors`}
              className="font-medium underline"
            >
              Create a floor
            </Link>{" "}
            before building a route.
          </AlertDescription>
        </Alert>
      ) : null}

      {hasFloors ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 py-4">
            <span className="text-muted-foreground mr-1 text-sm font-medium">
              Editing route for:
            </span>
            {floors.map((floor) => (
              <Button
                key={floor.id}
                type="button"
                size="sm"
                variant={
                  floor.id === selectedFloorId ? "default" : "outline"
                }
                onClick={() => setSelectedFloorId(floor.id)}
              >
                {floorLabel(floor)}
                <Badge variant="secondary">{floor.routeEdgeCount}</Badge>
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
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

      {!isLoading && !isError ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Route map preview</CardTitle>
              <CardDescription>
                Visual preview of spot coordinates and footprint polylines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RouteMapPreview spots={spots} edges={edges} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="size-4" />
                Route edges
              </CardTitle>
              <CardDescription>
                {edges.length} edge{edges.length === 1 ? "" : "s"} · routeVersion
                bumps on every change
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {edges.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No edges yet. Add spots first, then generate a chain or add
                  edges manually.
                </p>
              ) : (
                edges.map((edge) => (
                  <div
                    key={edge.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{edge.sortOrder}</Badge>
                        <span className="font-medium">
                          {edge.fromSpot.title}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{edge.toSpot.title}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Footprint:{" "}
                        {edge.footprintGeo
                          ? `${edge.footprintGeo.length} points`
                          : "none"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleteEdge.isPending}
                      onClick={() => void handleDelete(edge.id)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add edge</CardTitle>
              <CardDescription>
                Optional footprint: one <code>lat,lng</code> pair per line.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spots.length < 2 ? (
                <p className="text-muted-foreground text-sm">
                  Add at least two spots before creating route edges.{" "}
                  <Link
                    href={`/tours/${tourId}/spots/new`}
                    className="underline"
                  >
                    Add a spot
                  </Link>
                </p>
              ) : (
                <Form form={form} onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormSelect
                      name="fromSpotId"
                      label="From spot"
                      options={spotOptions}
                      placeholder="Select spot"
                    />
                    <FormSelect
                      name="toSpotId"
                      label="To spot"
                      options={spotOptions}
                      placeholder="Select spot"
                    />
                    <FormInput
                      name="sortOrder"
                      label="Order"
                      type="number"
                      min={0}
                    />
                  </div>
                  <FormTextarea
                    name="footprintText"
                    label="Footprint polyline (optional)"
                    rows={4}
                    placeholder={"41.8902,12.4922\n41.8910,12.4930"}
                  />
                  <Button type="submit" disabled={createEdge.isPending}>
                    {createEdge.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Add edge
                  </Button>
                </Form>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
