import type {
  RouteEdge,
  Spot,
  SpotTranslation,
  TourRoute,
} from "@/generated/prisma/client";
import { DEFAULT_LANGUAGE } from "@/lib/i18n/languages";
import type {
  FootprintPoint,
  RouteEdgeDto,
  RouteEdgeSpotSummary,
  TourRouteDto,
} from "./tour-route.types";

type SpotWithTranslations = Spot & { translations: SpotTranslation[] };

type RouteEdgeWithSpots = RouteEdge & {
  fromSpot: SpotWithTranslations;
  toSpot: SpotWithTranslations;
};

type TourRouteWithEdges = TourRoute & {
  edges: RouteEdgeWithSpots[];
};

function getSpotTitle(spot: SpotWithTranslations): string {
  const preferred =
    spot.translations.find((entry) => entry.language === DEFAULT_LANGUAGE) ??
    spot.translations[0];

  return preferred?.title ?? `Spot ${spot.sortOrder}`;
}

function mapSpotSummary(spot: SpotWithTranslations): RouteEdgeSpotSummary {
  return {
    id: spot.id,
    sortOrder: spot.sortOrder,
    title: getSpotTitle(spot),
  };
}

function parseFootprintGeo(value: unknown): FootprintPoint[] | null {
  if (!value || !Array.isArray(value)) {
    return null;
  }

  const points = value.flatMap((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      "lat" in entry &&
      "lng" in entry &&
      typeof entry.lat === "number" &&
      typeof entry.lng === "number"
    ) {
      return [{ lat: entry.lat, lng: entry.lng }];
    }

    return [];
  });

  return points.length >= 2 ? points : null;
}

export function toRouteEdgeDto(edge: RouteEdgeWithSpots): RouteEdgeDto {
  return {
    id: edge.id,
    fromSpotId: edge.fromSpotId,
    toSpotId: edge.toSpotId,
    fromSpot: mapSpotSummary(edge.fromSpot),
    toSpot: mapSpotSummary(edge.toSpot),
    sortOrder: edge.sortOrder,
    footprintGeo: parseFootprintGeo(edge.footprintGeo),
    createdAt: edge.createdAt.toISOString(),
    updatedAt: edge.updatedAt.toISOString(),
  };
}

export function toTourRouteDto(route: TourRouteWithEdges): TourRouteDto {
  return {
    id: route.id,
    floorId: route.floorId,
    tourId: route.tourId,
    edges: route.edges.map(toRouteEdgeDto),
    createdAt: route.createdAt.toISOString(),
    updatedAt: route.updatedAt.toISOString(),
  };
}
