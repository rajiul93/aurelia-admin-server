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

async function assertSpotsBelongToFloor(
  tourId: string,
  floorId: string,
  fromSpotId: string,
  toSpotId: string,
) {
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

  if (fromSpotId === toSpotId) {
    throw new ValidationError("From and to spots must be different");
  }
}

// Unused: floor existence checked inline in methods
// async function ensureFloorExists(floorId: string) {
//   const floor = await tourRouteRepository.findByFloorId(floorId);
//   if (!floor) {
//     throw new NotFoundError("Floor not found");
//   }
//   return floor;
// }

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

  // Deprecated: use replaceByFloor instead
  async replace(_tourId: string, _input: ReplaceTourRouteInput, _audit?: AuditContext) {
    throw new NotFoundError("Use replaceByFloor(floorId, ...) instead - deprecated tour-level API");
  },

  // Deprecated: use generateFromSpotsInFloor instead
  async generateFromSpots(_tourId: string, _audit?: AuditContext) {
    throw new NotFoundError("Use generateFromSpotsInFloor(floorId, ...) instead - deprecated tour-level API");
  },

  // Deprecated: use generateFootprintsFromOsrmInFloor instead
  async generateFootprintsFromOsrm(_tourId: string, _audit?: AuditContext) {
    throw new NotFoundError("Use generateFootprintsFromOsrmInFloor(floorId, ...) instead - deprecated tour-level API");
  },

  // Deprecated: use createEdgeInFloor instead
  async createEdge(
    _tourId: string,
    _input: CreateRouteEdgeInput,
    _audit?: AuditContext,
  ) {
    throw new NotFoundError("Use createEdgeInFloor(floorId, ...) instead - deprecated tour-level API");
  },

  // Deprecated: use updateEdgeInFloor instead
  async updateEdge(
    _tourId: string,
    _edgeId: string,
    _input: UpdateRouteEdgeInput,
    _audit?: AuditContext,
  ) {
    throw new NotFoundError("Use updateEdgeInFloor(floorId, ...) instead - deprecated tour-level API");
  },

  // Deprecated: use deleteEdgeInFloor instead
  async deleteEdge(_tourId: string, _edgeId: string, _audit?: AuditContext) {
    throw new NotFoundError("Use deleteEdgeInFloor(floorId, ...) instead - deprecated tour-level API");
  },

  async getByFloorId(floorId: string) {
    const route = await tourRouteRepository.findByFloorId(floorId);

    if (!route) {
      return {
        id: null,
        floorId,
        tourId: null,
        edges: [],
        createdAt: null,
        updatedAt: null,
      };
    }

    return toTourRouteDto(route);
  },

  async replaceByFloor(floorId: string, input: ReplaceTourRouteInput, audit?: AuditContext) {
    const previous = await tourRouteRepository.findByFloorId(floorId);

    // Get tour ID from floor for validation
    const floorData = await tourRouteRepository.findByFloorId(floorId);
    if (!floorData) {
      throw new NotFoundError("Floor not found");
    }
    const tourId = floorData.tourId;
    if (!tourId) {
      throw new ValidationError("Floor must belong to a tour");
    }

    for (const edge of input.edges) {
      await assertSpotsBelongToFloor(tourId, floorId, edge.fromSpotId, edge.toSpotId);
    }

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

  async generateFromSpotsInFloor(floorId: string, audit?: AuditContext) {
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
      footprintGeo: null as null,
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

  async generateFootprintsFromOsrmInFloor(floorId: string, audit?: AuditContext) {
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
        {
          lat: Number(fromSpot.latitude),
          lng: Number(fromSpot.longitude),
        },
        {
          lat: Number(toSpot.latitude),
          lng: Number(toSpot.longitude),
        },
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

  async createEdgeInFloor(
    floorId: string,
    input: CreateRouteEdgeInput,
    audit?: AuditContext,
  ) {
    const route = await tourRouteRepository.findByFloorId(floorId);
    if (!route) {
      throw new NotFoundError("Floor route not found");
    }
    const tourId = route.tourId;
    if (!tourId) {
      throw new ValidationError("Floor must belong to a tour");
    }

    await assertSpotsBelongToFloor(tourId, floorId, input.fromSpotId, input.toSpotId);

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

  async updateEdgeInFloor(
    floorId: string,
    edgeId: string,
    input: UpdateRouteEdgeInput,
    audit?: AuditContext,
  ) {
    const route = await tourRouteRepository.findByFloorId(floorId);
    if (!route) {
      throw new NotFoundError("Floor route not found");
    }
    const tourId = route.tourId;
    if (!tourId) {
      throw new ValidationError("Floor must belong to a tour");
    }

    const existing = await tourRouteRepository.findEdgeByIdInFloor(floorId, edgeId);
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

  async deleteEdgeInFloor(floorId: string, edgeId: string, audit?: AuditContext) {
    const existing = await tourRouteRepository.findEdgeByIdInFloor(floorId, edgeId);
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
