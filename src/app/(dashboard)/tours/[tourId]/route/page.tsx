"use client";

import { useState } from "react";
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
import { useSpots } from "@/hooks/queries/use-spots";
import { useTourRoute } from "@/hooks/queries/use-tour-route";
import { useTour } from "@/hooks/queries/use-tours";
import { getPreferredTranslation } from "@/lib/i18n/translations";
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

  const { data: tourResponse } = useTour(tourId);
  const { data: spotsResponse, isLoading: spotsLoading } = useSpots(tourId);
  const { data: routeResponse, isLoading: routeLoading, isError, error } =
    useTourRoute(tourId);

  const createEdge = useCreateRouteEdge(tourId);
  const deleteEdge = useDeleteRouteEdge(tourId);
  const generateRoute = useGenerateTourRoute(tourId);
  const generateFootprints = useGenerateRouteFootprints(tourId);

  const tour = tourResponse?.data;
  const spots = spotsResponse?.data ?? [];
  const edges = routeResponse?.data?.edges ?? [];

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

  const isLoading = spotsLoading || routeLoading;

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
              Define spot-to-spot edges and optional footprint polylines for
              offline navigation.
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
