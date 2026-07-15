import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errors";

vi.mock("./floor.repository", () => ({
  floorRepository: {
    findById: vi.fn(),
    findByTourId: vi.fn(),
    findByTourAndFloorNo: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findTransitionPointById: vi.fn(),
    createTransitionPoint: vi.fn(),
    updateTransitionPoint: vi.fn(),
    deleteTransitionPoint: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  auditService: { log: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tour: { findUnique: vi.fn().mockResolvedValue({ id: "tour-1" }) },
  },
}));

import { floorService } from "./floor.service";
import { floorRepository } from "./floor.repository";

function makeFloor(overrides: Record<string, unknown> = {}) {
  return {
    id: "floor-1",
    tourId: "tour-1",
    floorNo: 1,
    mapTileUrl: null,
    sortOrder: 0,
    coverMediaId: null,
    coverMedia: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [],
    spots: [],
    route: null,
    transitionPoints: [],
    ...overrides,
  } as never;
}

const createInput = {
  floorNo: 1,
  mapTileUrl: null,
  coverMediaId: null,
  sortOrder: 0,
  translations: undefined,
};

describe("FloorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates a floor", async () => {
      vi.mocked(floorRepository.findByTourAndFloorNo).mockResolvedValue(null);
      vi.mocked(floorRepository.create).mockResolvedValue(makeFloor());

      const result = await floorService.create("tour-1", createInput);

      expect(result.id).toBe("floor-1");
      expect(result.floorNo).toBe(1);
    });

    it("rejects a floorNo the tour already uses", async () => {
      vi.mocked(floorRepository.findByTourAndFloorNo).mockResolvedValue(
        makeFloor({ id: "existing-floor" }),
      );

      await expect(
        floorService.create("tour-1", createInput),
      ).rejects.toThrow(ConflictError);
      expect(floorRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("returns the floor with its spot and route counts", async () => {
      vi.mocked(floorRepository.findById).mockResolvedValue(
        makeFloor({
          spots: [{ id: "s1" }, { id: "s2" }],
          route: { id: "r1", edges: [{ id: "e1" }] },
        }),
      );

      const result = await floorService.getById("tour-1", "floor-1");

      expect(result.spotCount).toBe(2);
      expect(result.routeEdgeCount).toBe(1);
    });

    it("throws when the floor is not on this tour", async () => {
      vi.mocked(floorRepository.findById).mockResolvedValue(null);

      await expect(floorService.getById("tour-1", "floor-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("listByTour", () => {
    it("returns all floors for a tour", async () => {
      vi.mocked(floorRepository.findByTourId).mockResolvedValue([makeFloor()]);

      const result = await floorService.listByTour("tour-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.floorNo).toBe(1);
    });
  });

  describe("transition points", () => {
    const pointInput = {
      type: "STAIRS" as const,
      latitude: 41.89,
      longitude: 12.49,
      connectsToFloorId: "floor-2",
      sortOrder: 0,
    };

    it("rejects a transition pointing at a floor of another tour", async () => {
      vi.mocked(floorRepository.findById)
        .mockResolvedValueOnce(makeFloor()) // the floor being edited
        .mockResolvedValueOnce(null); // connectsToFloor is not on this tour

      await expect(
        floorService.createTransitionPoint("tour-1", "floor-1", pointInput),
      ).rejects.toThrow(ValidationError);
      expect(floorRepository.createTransitionPoint).not.toHaveBeenCalled();
    });

    it("rejects a transition that connects a floor to itself", async () => {
      vi.mocked(floorRepository.findById).mockResolvedValue(makeFloor());

      await expect(
        floorService.createTransitionPoint("tour-1", "floor-1", {
          ...pointInput,
          connectsToFloorId: "floor-1",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("creates a transition between two floors of the same tour", async () => {
      vi.mocked(floorRepository.findById)
        .mockResolvedValueOnce(makeFloor())
        .mockResolvedValueOnce(makeFloor({ id: "floor-2", floorNo: 2 }));
      vi.mocked(floorRepository.createTransitionPoint).mockResolvedValue({
        id: "point-1",
        floorId: "floor-1",
        type: "STAIRS",
        latitude: 41.89,
        longitude: 12.49,
        connectsToFloorId: "floor-2",
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const result = await floorService.createTransitionPoint(
        "tour-1",
        "floor-1",
        pointInput,
      );

      expect(result.type).toBe("STAIRS");
      expect(result.connectsToFloorId).toBe("floor-2");
    });
  });
});
