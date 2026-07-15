import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/api/errors";

vi.mock("./tour-route.repository", () => ({
  tourRouteRepository: {
    findByFloorId: vi.fn(),
    upsertRoute: vi.fn(),
    replaceEdges: vi.fn(),
    findEdgeByIdInFloor: vi.fn(),
    createEdgeInFloor: vi.fn(),
    updateEdgeInFloor: vi.fn(),
    deleteEdgeInFloor: vi.fn(),
  },
}));

vi.mock("@/modules/floor/floor.repository", () => ({
  floorRepository: { findById: vi.fn() },
}));

vi.mock("@/modules/spot/spot.repository", () => ({
  spotRepository: {
    findById: vi.fn(),
    findByFloorId: vi.fn(),
  },
}));

vi.mock("@/lib/routing/osrm", () => ({
  fetchWalkingFootprint: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  auditService: { log: vi.fn() },
}));

import { tourRouteService } from "./tour-route.service";
import { tourRouteRepository } from "./tour-route.repository";
import { floorRepository } from "@/modules/floor/floor.repository";
import { spotRepository } from "@/modules/spot/spot.repository";

const floor = { id: "floor-1", tourId: "tour-1", floorNo: 1 };

function makeEdge(overrides: Record<string, unknown> = {}) {
  return {
    id: "edge-1",
    routeId: "route-1",
    fromSpotId: "spot-1",
    toSpotId: "spot-2",
    sortOrder: 0,
    footprintGeo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    fromSpot: { id: "spot-1", translations: [] },
    toSpot: { id: "spot-2", translations: [] },
    ...overrides,
  } as never;
}

const edgeInput = { fromSpotId: "spot-1", toSpotId: "spot-2", sortOrder: 0 };

describe("TourRouteService — floor scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(floorRepository.findById).mockResolvedValue(floor as never);
    vi.mocked(spotRepository.findById).mockImplementation(
      async (_tourId, _floorId, spotId) => ({ id: spotId }) as never,
    );
  });

  it("rejects a floor that belongs to another tour", async () => {
    vi.mocked(floorRepository.findById).mockResolvedValue(null);

    await expect(
      tourRouteService.getByFloor("tour-1", "floor-of-other-tour"),
    ).rejects.toThrow(NotFoundError);
  });

  it("returns an empty route for a floor that has none yet", async () => {
    vi.mocked(tourRouteRepository.findByFloorId).mockResolvedValue(null);

    const route = await tourRouteService.getByFloor("tour-1", "floor-1");

    expect(route.id).toBeNull();
    expect(route.edges).toEqual([]);
  });

  describe("createEdge", () => {
    it("creates the floor's route on the first edge", async () => {
      vi.mocked(tourRouteRepository.upsertRoute).mockResolvedValue({
        id: "route-1",
      } as never);
      vi.mocked(tourRouteRepository.createEdgeInFloor).mockResolvedValue(
        makeEdge(),
      );

      const edge = await tourRouteService.createEdge(
        "tour-1",
        "floor-1",
        edgeInput as never,
      );

      expect(tourRouteRepository.upsertRoute).toHaveBeenCalledWith("floor-1");
      expect(edge.id).toBe("edge-1");
    });

    it("rejects an edge to a spot that is not on this floor", async () => {
      vi.mocked(spotRepository.findById).mockImplementation(
        async (_tourId, _floorId, spotId) =>
          spotId === "spot-2" ? null : ({ id: spotId } as never),
      );

      await expect(
        tourRouteService.createEdge("tour-1", "floor-1", edgeInput as never),
      ).rejects.toThrow(ValidationError);
      expect(tourRouteRepository.createEdgeInFloor).not.toHaveBeenCalled();
    });

    it("rejects an edge from a spot to itself", async () => {
      await expect(
        tourRouteService.createEdge("tour-1", "floor-1", {
          ...edgeInput,
          toSpotId: "spot-1",
        } as never),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("generateFromSpots", () => {
    it("chains only the spots on the given floor", async () => {
      vi.mocked(spotRepository.findByFloorId).mockResolvedValue([
        { id: "spot-2", sortOrder: 1 },
        { id: "spot-1", sortOrder: 0 },
        { id: "spot-3", sortOrder: 2 },
      ] as never);
      vi.mocked(tourRouteRepository.findByFloorId).mockResolvedValue(null);
      vi.mocked(tourRouteRepository.replaceEdges).mockResolvedValue({
        id: "route-1",
        floorId: "floor-1",
        edges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      await tourRouteService.generateFromSpots("tour-1", "floor-1");

      expect(spotRepository.findByFloorId).toHaveBeenCalledWith("floor-1");
      expect(tourRouteRepository.replaceEdges).toHaveBeenCalledWith("floor-1", [
        { fromSpotId: "spot-1", toSpotId: "spot-2", sortOrder: 0, footprintGeo: null },
        { fromSpotId: "spot-2", toSpotId: "spot-3", sortOrder: 1, footprintGeo: null },
      ]);
    });

    it("refuses to generate from fewer than two spots", async () => {
      vi.mocked(spotRepository.findByFloorId).mockResolvedValue([
        { id: "spot-1", sortOrder: 0 },
      ] as never);

      await expect(
        tourRouteService.generateFromSpots("tour-1", "floor-1"),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("deleteEdge", () => {
    it("refuses an edge that is not on this floor", async () => {
      vi.mocked(tourRouteRepository.findEdgeByIdInFloor).mockResolvedValue(null);

      await expect(
        tourRouteService.deleteEdge("tour-1", "floor-1", "edge-x"),
      ).rejects.toThrow(NotFoundError);
      expect(tourRouteRepository.deleteEdgeInFloor).not.toHaveBeenCalled();
    });

    it("deletes an edge on this floor", async () => {
      vi.mocked(tourRouteRepository.findEdgeByIdInFloor).mockResolvedValue(
        makeEdge(),
      );

      await tourRouteService.deleteEdge("tour-1", "floor-1", "edge-1");

      expect(tourRouteRepository.deleteEdgeInFloor).toHaveBeenCalledWith(
        "edge-1",
        "floor-1",
      );
    });
  });
});
