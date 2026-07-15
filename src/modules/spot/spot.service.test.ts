import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/api/errors";

vi.mock("./spot.repository", () => ({
  spotRepository: {
    findById: vi.fn(),
    findByTourAndId: vi.fn(),
    findByFloorId: vi.fn(),
    findByTourId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/modules/floor/floor.repository", () => ({
  floorRepository: { findById: vi.fn() },
}));

vi.mock("@/modules/tour/tour.repository", () => ({
  tourRepository: {
    findById: vi.fn(),
    getFloor1ByTourId: vi.fn(),
  },
}));

vi.mock("@/lib/audit", () => ({
  auditService: { log: vi.fn() },
}));

import { spotService } from "./spot.service";
import { spotRepository } from "./spot.repository";
import { floorRepository } from "@/modules/floor/floor.repository";
import { tourRepository } from "@/modules/tour/tour.repository";

function makeSpot(overrides: Record<string, unknown> = {}) {
  return {
    id: "spot-1",
    floorId: "floor-1",
    tourId: "tour-1",
    sortOrder: 0,
    latitude: null,
    longitude: null,
    includedInQuickTour: true,
    thumbnailMediaId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [],
    faqs: [],
    media: [],
    ...overrides,
  } as never;
}

const translations = [
  {
    audience: "ADULTS" as const,
    language: "en" as const,
    title: "T",
    shortDesc: "",
    quillJson: { html: "", text: "" },
    descriptionHtml: "",
    descriptionText: "",
  },
];

describe("SpotService — floor placement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("places the spot on the floor the caller picked", async () => {
      vi.mocked(floorRepository.findById).mockResolvedValue({
        id: "floor-2",
      } as never);
      vi.mocked(spotRepository.create).mockResolvedValue(
        makeSpot({ floorId: "floor-2" }),
      );

      await spotService.create("tour-1", {
        floorId: "floor-2",
        sortOrder: 0,
        latitude: null,
        longitude: null,
        includedInQuickTour: true,
        translations,
      });

      expect(spotRepository.create).toHaveBeenCalledWith(
        "floor-2",
        expect.anything(),
      );
    });

    it("falls back to the tour's lowest floor when none is given", async () => {
      vi.mocked(tourRepository.getFloor1ByTourId).mockResolvedValue({
        id: "floor-1",
      } as never);
      vi.mocked(spotRepository.create).mockResolvedValue(makeSpot());

      await spotService.create("tour-1", {
        floorId: undefined,
        sortOrder: 0,
        latitude: null,
        longitude: null,
        includedInQuickTour: true,
        translations,
      });

      expect(spotRepository.create).toHaveBeenCalledWith(
        "floor-1",
        expect.anything(),
      );
    });

    it("rejects a floor that belongs to another tour", async () => {
      vi.mocked(floorRepository.findById).mockResolvedValue(null);

      await expect(
        spotService.create("tour-1", {
          floorId: "floor-of-other-tour",
          sortOrder: 0,
          latitude: null,
          longitude: null,
          includedInQuickTour: true,
          translations,
        }),
      ).rejects.toThrow(ValidationError);
      expect(spotRepository.create).not.toHaveBeenCalled();
    });

    it("refuses to create a spot on a tour with no floors", async () => {
      vi.mocked(tourRepository.getFloor1ByTourId).mockResolvedValue(null);

      await expect(
        spotService.create("tour-1", {
          floorId: undefined,
          sortOrder: 0,
          latitude: null,
          longitude: null,
          includedInQuickTour: true,
          translations,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("update", () => {
    it("moves the spot when a different floor is given", async () => {
      vi.mocked(spotRepository.findById).mockResolvedValue(makeSpot());
      vi.mocked(floorRepository.findById).mockResolvedValue({
        id: "floor-2",
      } as never);
      vi.mocked(spotRepository.update).mockResolvedValue(
        makeSpot({ floorId: "floor-2" }),
      );

      await spotService.update("tour-1", "floor-1", "spot-1", {
        floorId: "floor-2",
        sortOrder: undefined,
        latitude: undefined,
        longitude: undefined,
        includedInQuickTour: undefined,
        translations: undefined,
      });

      expect(spotRepository.update).toHaveBeenCalledWith(
        "spot-1",
        expect.objectContaining({
          floor: { connect: { id: "floor-2" } },
        }),
      );
    });

    it("leaves the floor alone when the same one is given", async () => {
      vi.mocked(spotRepository.findById).mockResolvedValue(makeSpot());
      vi.mocked(spotRepository.update).mockResolvedValue(makeSpot());

      await spotService.update("tour-1", "floor-1", "spot-1", {
        floorId: "floor-1",
        sortOrder: 3,
        latitude: undefined,
        longitude: undefined,
        includedInQuickTour: undefined,
        translations: undefined,
      });

      const payload = vi.mocked(spotRepository.update).mock.calls[0]?.[1];
      expect(payload).not.toHaveProperty("floor");
      expect(payload).toMatchObject({ sortOrder: 3 });
    });
  });

  describe("getFloorIdForSpot", () => {
    it("returns the floor the spot actually sits on", async () => {
      vi.mocked(spotRepository.findByTourAndId).mockResolvedValue(
        makeSpot({ floorId: "floor-3" }),
      );

      const floorId = await spotService.getFloorIdForSpot("tour-1", "spot-1");

      expect(floorId).toBe("floor-3");
    });

    it("throws when the spot is not on this tour", async () => {
      vi.mocked(spotRepository.findByTourAndId).mockResolvedValue(null);

      await expect(
        spotService.getFloorIdForSpot("tour-1", "spot-1"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
