import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { fetchWalkingFootprint } from "@/lib/routing/osrm";
import { spotRepository } from "@/modules/spot/spot.repository";
import { tourRepository } from "@/modules/tour/tour.repository";
import { toRouteEdgeDto, toTourRouteDto } from "./tour-route.mapper";
import { tourRouteRepository } from "./tour-route.repository";
import type {
  CreateRouteEdgeInput,
  ReplaceTourRouteInput,
  UpdateRouteEdgeInput,
} from "./tour-route.schema";

async function ensureTourExists(tourId: string) {
  const tour = await tourRepository.findById(tourId);
  if (!tour) {
    throw new NotFoundError("Tour not found");
  }

  return tour;
}

async function assertSpotsBelongToTour(
  tourId: string,
  fromSpotId: string,
  toSpotId: string,
) {
  const [fromSpot, toSpot] = await Promise.all([
    spotRepository.findById(tourId, fromSpotId),
    spotRepository.findById(tourId, toSpotId),
  ]);

  if (!fromSpot) {
    throw new ValidationError("From spot not found on this tour");
  }

  if (!toSpot) {
    throw new ValidationError("To spot not found on this tour");
  }

  if (fromSpotId === toSpotId) {
    throw new ValidationError("From and to spots must be different");
  }
}

function mapAuditRoute(
  route: Awaited<ReturnType<typeof tourRouteRepository.findByTourId>>,
) {
  if (!route) {
    return null;
  }

  return {
    id: route.id,
    tourId: route.tourId,
    edges: route.edges.map((edge) => ({
      id: edge.id,
      fromSpotId: edge.fromSpotId,
      toSpotId: edge.toSpotId,
      sortOrder: edge.sortOrder,
      footprintPointCount: Array.isArray(edge.footprintGeo)
        ? edge.footprintGeo.length
        : 0,
    })),
  };
}

export const tourRouteService = {
  async getByTourId(tourId: string) {
    await ensureTourExists(tourId);
    const route = await tourRouteRepository.findByTourId(tourId);

    if (!route) {
      return {
        id: null,
        tourId,
        edges: [],
        createdAt: null,
        updatedAt: null,
      };
    }

    return toTourRouteDto(route);
  },

  async replace(tourId: string, input: ReplaceTourRouteInput, audit?: AuditContext) {
    await ensureTourExists(tourId);
    const previous = await tourRouteRepository.findByTourId(tourId);

    for (const edge of input.edges) {
      await assertSpotsBelongToTour(tourId, edge.fromSpotId, edge.toSpotId);
    }

    const route = await tourRouteRepository.replaceEdges(
      tourId,
      input.edges.map((edge) => ({
        fromSpotId: edge.fromSpotId,
        toSpotId: edge.toSpotId,
        sortOrder: edge.sortOrder,
        footprintGeo: edge.footprintGeo ?? null,
      })),
    );

    await auditService.log({
      module: "tour-route",
      actionType: "UPDATE",
      entityId: route.id,
      previousValue: mapAuditRoute(previous),
      newValue: mapAuditRoute(route),
      context: audit,
    });

    return toTourRouteDto(route);
  },

  async generateFromSpots(tourId: string, audit?: AuditContext) {
    await ensureTourExists(tourId);
    const spots = await spotRepository.findByTourId(tourId);

    if (spots.length < 2) {
      throw new ValidationError(
        "At least two spots are required to generate a route",
      );
    }

    const sorted = [...spots].sort((a, b) => a.sortOrder - b.sortOrder);
    const edges = sorted.slice(0, -1).map((spot, index) => ({
      fromSpotId: spot.id,
      toSpotId: sorted[index + 1]!.id,
      sortOrder: index,
      footprintGeo: null as null,
    }));

    const previous = await tourRouteRepository.findByTourId(tourId);
    const route = await tourRouteRepository.replaceEdges(tourId, edges);

    await auditService.log({
      module: "tour-route",
      actionType: "UPDATE",
      entityId: route.id,
      previousValue: mapAuditRoute(previous),
      newValue: mapAuditRoute(route),
      context: audit,
    });

    return toTourRouteDto(route);
  },

  async generateFootprintsFromOsrm(tourId: string, audit?: AuditContext) {
    await ensureTourExists(tourId);
    const route = await tourRouteRepository.findByTourId(tourId);

    if (!route || route.edges.length === 0) {
      throw new ValidationError(
        "Create route edges before generating walking footprints",
      );
    }

    const spotById = new Map(
      (await spotRepository.findByTourId(tourId)).map((spot) => [spot.id, spot]),
    );

    for (const edge of [...route.edges].sort(
      (left, right) => left.sortOrder - right.sortOrder,
    )) {
      const fromSpot = spotById.get(edge.fromSpotId);
      const toSpot = spotById.get(edge.toSpotId);

      if (
        !fromSpot?.latitude ||
        !fromSpot.longitude ||
        !toSpot?.latitude ||
        !toSpot.longitude
      ) {
        throw new ValidationError(
          "Every spot on the route must have latitude and longitude before generating footprints",
        );
      }

      const footprintGeo = await fetchWalkingFootprint(
        {
          lat: Number(fromSpot.latitude),
          lng: Number(fromSpot.longitude),
        },
        {
          lat: Number(toSpot.latitude),
          lng: Number(toSpot.longitude),
        },
      );

      await tourRouteRepository.updateEdge(edge.id, tourId, {
        footprintGeo,
      });
    }

    const refreshed = await tourRouteRepository.findByTourId(tourId);

    await auditService.log({
      module: "tour-route",
      actionType: "UPDATE",
      entityId: refreshed?.id ?? route.id,
      previousValue: mapAuditRoute(route),
      newValue: mapAuditRoute(refreshed),
      context: audit,
    });

    return toTourRouteDto(refreshed!);
  },

  async createEdge(
    tourId: string,
    input: CreateRouteEdgeInput,
    audit?: AuditContext,
  ) {
    await ensureTourExists(tourId);
    await assertSpotsBelongToTour(tourId, input.fromSpotId, input.toSpotId);

    const route = await tourRouteRepository.upsertRoute(tourId);
    const edge = await tourRouteRepository.createEdge(route.id, tourId, {
      fromSpotId: input.fromSpotId,
      toSpotId: input.toSpotId,
      sortOrder: input.sortOrder,
      footprintGeo: input.footprintGeo ?? null,
    });

    await auditService.log({
      module: "tour-route",
      actionType: "CREATE",
      entityId: edge.id,
      newValue: toRouteEdgeDto(edge),
      context: audit,
    });

    return toRouteEdgeDto(edge);
  },

  async updateEdge(
    tourId: string,
    edgeId: string,
    input: UpdateRouteEdgeInput,
    audit?: AuditContext,
  ) {
    const existing = await tourRouteRepository.findEdgeById(tourId, edgeId);
    if (!existing) {
      throw new NotFoundError("Route edge not found");
    }

    const fromSpotId = input.fromSpotId ?? existing.fromSpotId;
    const toSpotId = input.toSpotId ?? existing.toSpotId;
    await assertSpotsBelongToTour(tourId, fromSpotId, toSpotId);

    const edge = await tourRouteRepository.updateEdge(edgeId, tourId, {
      fromSpotId: input.fromSpotId,
      toSpotId: input.toSpotId,
      sortOrder: input.sortOrder,
      footprintGeo: input.footprintGeo,
    });

    await auditService.log({
      module: "tour-route",
      actionType: "UPDATE",
      entityId: edge.id,
      previousValue: toRouteEdgeDto(existing),
      newValue: toRouteEdgeDto(edge),
      context: audit,
    });

    return toRouteEdgeDto(edge);
  },

  async deleteEdge(tourId: string, edgeId: string, audit?: AuditContext) {
    const existing = await tourRouteRepository.findEdgeById(tourId, edgeId);
    if (!existing) {
      throw new NotFoundError("Route edge not found");
    }

    await tourRouteRepository.deleteEdge(edgeId, tourId);

    await auditService.log({
      module: "tour-route",
      actionType: "DELETE",
      entityId: edgeId,
      previousValue: toRouteEdgeDto(existing),
      context: audit,
    });
  },
};
