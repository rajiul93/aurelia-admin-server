import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { fetchWalkingFootprint } from "@/lib/routing/osrm";
import { floorRepository } from "@/modules/floor/floor.repository";
import { spotRepository } from "@/modules/spot/spot.repository";
import { toRouteEdgeDto, toTourRouteDto } from "./tour-route.mapper";
import { tourRouteRepository } from "./tour-route.repository";
import type {
  CreateRouteEdgeInput,
  ReplaceTourRouteInput,
  UpdateRouteEdgeInput,
} from "./tour-route.schema";

// Every route operation is scoped to one floor of one tour. Resolving the floor
// *through* the tour is what stops a floorId from another tour being edited here.
async function ensureFloorInTour(tourId: string, floorId: string) {
  const floor = await floorRepository.findById(tourId, floorId);
  if (!floor) {
    throw new NotFoundError("Floor not found on this tour");
  }

  return floor;
}

// A route may only connect spots that live on its own floor — an edge across
// floors is a transition point, not a route edge.
async function assertSpotsBelongToFloor(
  tourId: string,
  floorId: string,
  fromSpotId: string,
  toSpotId: string,
) {
  if (fromSpotId === toSpotId) {
    throw new ValidationError("From and to spots must be different");
  }

  const [fromSpot, toSpot] = await Promise.all([
    spotRepository.findById(tourId, floorId, fromSpotId),
    spotRepository.findById(tourId, floorId, toSpotId),
  ]);

  if (!fromSpot) {
    throw new ValidationError("From spot not found on this floor");
  }

  if (!toSpot) {
    throw new ValidationError("To spot not found on this floor");
  }
}

function mapAuditRoute(
  route: Awaited<ReturnType<typeof tourRouteRepository.findByFloorId>>,
) {
  if (!route) {
    return null;
  }

  return {
    id: route.id,
    floorId: route.floorId,
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
  async getByFloor(tourId: string, floorId: string) {
    await ensureFloorInTour(tourId, floorId);
    const route = await tourRouteRepository.findByFloorId(floorId);

    if (!route) {
      return {
        id: null,
        floorId,
        edges: [],
        createdAt: null,
        updatedAt: null,
      };
    }

    return toTourRouteDto(route);
  },

  async replaceByFloor(
    tourId: string,
    floorId: string,
    input: ReplaceTourRouteInput,
    audit?: AuditContext,
  ) {
    await ensureFloorInTour(tourId, floorId);

    // Four queries per edge, sequentially: assertSpotsBelongToFloor looks up
    // two spots, and spotRepository.findById is itself two round trips whose
    // deep include this caller discards. The edges array is capped at 200 in
    // the schema to bound that. Worth collapsing into a single
    // findMany({ id: { in: [...] }, select: { id: true } }) if this endpoint
    // ever gains a caller — nothing in this repo calls it today.
    for (const edge of input.edges) {
      await assertSpotsBelongToFloor(
        tourId,
        floorId,
        edge.fromSpotId,
        edge.toSpotId,
      );
    }

    const previous = await tourRouteRepository.findByFloorId(floorId);
    const route = await tourRouteRepository.replaceEdges(
      floorId,
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

  async generateFromSpots(
    tourId: string,
    floorId: string,
    audit?: AuditContext,
  ) {
    await ensureFloorInTour(tourId, floorId);

    const spots = await spotRepository.findByFloorId(floorId);

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
      footprintGeo: null,
    }));

    const previous = await tourRouteRepository.findByFloorId(floorId);
    const route = await tourRouteRepository.replaceEdges(floorId, edges);

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

  async generateFootprintsFromOsrm(
    tourId: string,
    floorId: string,
    audit?: AuditContext,
  ) {
    await ensureFloorInTour(tourId, floorId);

    const route = await tourRouteRepository.findByFloorId(floorId);

    if (!route || route.edges.length === 0) {
      throw new ValidationError(
        "Create route edges before generating walking footprints",
      );
    }

    const spots = await spotRepository.findByFloorId(floorId);
    const spotById = new Map(spots.map((spot) => [spot.id, spot]));

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
        { lat: Number(fromSpot.latitude), lng: Number(fromSpot.longitude) },
        { lat: Number(toSpot.latitude), lng: Number(toSpot.longitude) },
      );

      await tourRouteRepository.updateEdgeInFloor(edge.id, floorId, {
        footprintGeo,
      });
    }

    const refreshed = await tourRouteRepository.findByFloorId(floorId);

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
    floorId: string,
    input: CreateRouteEdgeInput,
    audit?: AuditContext,
  ) {
    await ensureFloorInTour(tourId, floorId);
    await assertSpotsBelongToFloor(
      tourId,
      floorId,
      input.fromSpotId,
      input.toSpotId,
    );

    // A floor's route is created on its first edge rather than up front.
    const route = await tourRouteRepository.upsertRoute(floorId);

    const edge = await tourRouteRepository.createEdgeInFloor(route.id, floorId, {
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
    floorId: string,
    edgeId: string,
    input: UpdateRouteEdgeInput,
    audit?: AuditContext,
  ) {
    await ensureFloorInTour(tourId, floorId);

    const existing = await tourRouteRepository.findEdgeByIdInFloor(
      floorId,
      edgeId,
    );
    if (!existing) {
      throw new NotFoundError("Route edge not found");
    }

    const fromSpotId = input.fromSpotId ?? existing.fromSpotId;
    const toSpotId = input.toSpotId ?? existing.toSpotId;
    await assertSpotsBelongToFloor(tourId, floorId, fromSpotId, toSpotId);

    const edge = await tourRouteRepository.updateEdgeInFloor(edgeId, floorId, {
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

  async deleteEdge(
    tourId: string,
    floorId: string,
    edgeId: string,
    audit?: AuditContext,
  ) {
    await ensureFloorInTour(tourId, floorId);

    const existing = await tourRouteRepository.findEdgeByIdInFloor(
      floorId,
      edgeId,
    );
    if (!existing) {
      throw new NotFoundError("Route edge not found");
    }

    await tourRouteRepository.deleteEdgeInFloor(edgeId, floorId);

    await auditService.log({
      module: "tour-route",
      actionType: "DELETE",
      entityId: edgeId,
      previousValue: toRouteEdgeDto(existing),
      context: audit,
    });
  },
};
