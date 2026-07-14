import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundError } from "@/lib/api/errors";

// Mock dependencies before importing the service
vi.mock("./floor.repository", () => ({
  floorRepository: {
    findById: vi.fn(),
    findByTourId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  auditService: {
    log: vi.fn(),
  },
}));

import { floorService } from "./floor.service";
import { floorRepository } from "./floor.repository";

describe("FloorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a floor with floorNo", async () => {
      const floorData = { floorNo: 1, mapTileUrl: "https://example.com/map" };
      const mockFloor = {
        id: "floor-1",
        tourId: "tour-1",
        ...floorData,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
        spots: [],
        route: null,
        transitionPoints: [],
      };

      vi.mocked(floorRepository.create).mockResolvedValue(mockFloor as any);

      const result = await floorService.create("tour-1", floorData);

      expect(result.id).toBe("floor-1");
      expect(result.floorNo).toBe(1);
    });
  });

  describe("getById", () => {
    it("should return floor by ID", async () => {
      const mockFloor = {
        id: "floor-1",
        tourId: "tour-1",
        floorNo: 1,
        mapTileUrl: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
        spots: [],
        route: null,
        transitionPoints: [],
      };

      vi.mocked(floorRepository.findById).mockResolvedValue(mockFloor as any);

      const result = await floorService.getById("tour-1", "floor-1");

      expect(result.id).toBe("floor-1");
    });

    it("should throw NotFoundError when floor not found", async () => {
      vi.mocked(floorRepository.findById).mockResolvedValue(null);

      await expect(floorService.getById("tour-1", "floor-1")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("listByTour", () => {
    it("should return all floors for a tour", async () => {
      const floors = [
        {
          id: "floor-1",
          tourId: "tour-1",
          floorNo: 1,
          mapTileUrl: null,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          translations: [],
          spots: [],
          route: null,
          transitionPoints: [],
        },
      ];

      vi.mocked(floorRepository.findByTourId).mockResolvedValue(floors as any);

      const result = await floorService.listByTour("tour-1");

      expect(result).toHaveLength(1);
      expect(result[0]?.floorNo).toBe(1);
    });
  });
});
