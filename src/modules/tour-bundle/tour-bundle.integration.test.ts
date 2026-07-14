import { describe, it, expect } from "vitest";
import { buildTourBundleArtifacts } from "./tour-bundle.builder";
import type { TourWithBundleRelations } from "./tour-bundle.repository";

describe("TourBundleIntegration", () => {
  const mockTourWithFloors: TourWithBundleRelations = {
    id: "tour-1",
    slug: "colosseum",
    placeId: null,
    coverMediaId: null,
    coverMedia: null,
    publishStatus: "PUBLISHED",
    tourBundleVersion: 1,
    mediaVersion: 1,
    aiKnowledgeVersion: 1,
    routeVersion: 1,
    publishedAt: new Date(),
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [
      {
        id: "t1",
        tourId: "tour-1",
        language: "en",
        audience: "ADULTS",
        title: "Colosseum",
        description: "Ancient Roman amphitheater",
        slug: "colosseum",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    floors: [
      {
        id: "floor-1",
        tourId: "tour-1",
        floorNo: 1,
        mapTileUrl: "https://tiles.example.com/floor1/{z}/{x}/{y}.pbf",
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
        spots: [
          {
            id: "spot-1",
            floorId: "floor-1",
            tourId: "tour-1",
            sortOrder: 0,
            latitude: 41.89 as any,
            longitude: 12.49 as any,
            includedInQuickTour: true,
            thumbnailMediaId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            translations: [
              {
                id: "st1",
                spotId: "spot-1",
                language: "en",
                audience: "ADULTS",
                title: "Entrance",
                shortDesc: "Main entrance",
                quillJson: null,
                descriptionHtml: "<p>Main entrance</p>",
                descriptionText: "Main entrance",
                interestingFactsText: "",
                interestingFactsHtml: "",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            faqs: [],
            media: [],
          },
        ],
        route: {
          id: "route-1",
          floorId: "floor-1",
          tourId: "tour-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          edges: [],
        },
        transitionPoints: [],
      },
      {
        id: "floor-2",
        tourId: "tour-1",
        floorNo: 2,
        mapTileUrl: "https://tiles.example.com/floor2/{z}/{x}/{y}.pbf",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
        spots: [
          {
            id: "spot-2",
            floorId: "floor-2",
            tourId: "tour-1",
            sortOrder: 0,
            latitude: 41.89 as any,
            longitude: 12.49 as any,
            includedInQuickTour: false,
            thumbnailMediaId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            translations: [
              {
                id: "st2",
                spotId: "spot-2",
                language: "en",
                audience: "ADULTS",
                title: "Upper level",
                shortDesc: "Second floor",
                quillJson: null,
                descriptionHtml: "<p>Upper level</p>",
                descriptionText: "Upper level",
                interestingFactsText: "",
                interestingFactsHtml: "",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            faqs: [],
            media: [],
          },
        ],
        route: {
          id: "route-2",
          floorId: "floor-2",
          tourId: "tour-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          edges: [],
        },
        transitionPoints: [],
      },
    ],
    aiKnowledge: [],
  };

  describe("v2 bundle format", () => {
    it("should build v2 bundle with per-floor routes", () => {
      const artifacts = buildTourBundleArtifacts(mockTourWithFloors, "2");

      expect(artifacts.manifest.bundleFormatVersion).toBe("2");
      expect((artifacts.content as any).floors).toBeDefined();
      expect((artifacts.content as any).floors).toHaveLength(2);
      expect((artifacts.content as any).floors?.[0]?.id).toBe("floor-1");
      expect((artifacts.content as any).floors?.[0]?.route).toBeDefined();
      expect((artifacts.content as any).floors?.[1]?.id).toBe("floor-2");
    });

    it("should include map tile URLs in v2 format", () => {
      const artifacts = buildTourBundleArtifacts(mockTourWithFloors, "2");

      expect((artifacts.content as any).floors?.[0]?.mapTileUrl).toBe(
        "https://tiles.example.com/floor1/{z}/{x}/{y}.pbf",
      );
      expect((artifacts.content as any).floors?.[1]?.mapTileUrl).toBe(
        "https://tiles.example.com/floor2/{z}/{x}/{y}.pbf",
      );
    });
  });

  describe("v1 bundle format (backward compat)", () => {
    it("should build v1 bundle with single flattened route", () => {
      const artifacts = buildTourBundleArtifacts(mockTourWithFloors, "1");

      expect(artifacts.manifest.bundleFormatVersion).toBe("1");
      expect((artifacts.content as any).route).toBeDefined();
      expect((artifacts.content as any).floors).toBeUndefined();
    });
  });

  describe("bundle manifest", () => {
    it("should include format version in manifest", () => {
      const v2Artifacts = buildTourBundleArtifacts(mockTourWithFloors, "2");
      const v1Artifacts = buildTourBundleArtifacts(mockTourWithFloors, "1");

      expect(v2Artifacts.manifest.bundleFormatVersion).toBe("2");
      expect(v1Artifacts.manifest.bundleFormatVersion).toBe("1");
    });

    it("should have signed manifest", () => {
      const artifacts = buildTourBundleArtifacts(mockTourWithFloors, "2");

      expect(artifacts.manifest.signature).toBeDefined();
      expect(artifacts.manifest.signatureAlgorithm).toBeDefined();
      expect(artifacts.manifest.checksum).toBeDefined();
    });
  });
});
