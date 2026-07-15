import { describe, it, expect } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { buildTourBundleArtifacts } from "./tour-bundle.builder";
import type {
  BundleContentV1,
  BundleContentV2,
} from "./tour-bundle.builder";
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
        coverMediaId: "media-floor-1",
        coverMedia: {
          id: "media-floor-1",
          url: "https://cdn.example.com/floor-1-cover.jpg",
          fileName: "floor-1-cover.jpg",
          originalName: "floor-1-cover.jpg",
          key: "floors/floor-1-cover.jpg",
          mimeType: "image/jpeg",
          size: 1024,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [
          {
            id: "ft-1",
            floorId: "floor-1",
            language: "en",
            audience: "ADULTS",
            name: "Ground Floor",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        spots: [
          {
            id: "spot-1",
            floorId: "floor-1",
            tourId: "tour-1",
            sortOrder: 0,
            latitude: new Prisma.Decimal(41.89),
            longitude: new Prisma.Decimal(12.49),
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
        coverMediaId: null,
        coverMedia: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        translations: [],
        spots: [
          {
            id: "spot-2",
            floorId: "floor-2",
            tourId: "tour-1",
            sortOrder: 0,
            latitude: new Prisma.Decimal(41.89),
            longitude: new Prisma.Decimal(12.49),
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
      expect((artifacts.content as BundleContentV2).floors).toBeDefined();
      expect((artifacts.content as BundleContentV2).floors).toHaveLength(2);
      expect((artifacts.content as BundleContentV2).floors?.[0]?.id).toBe("floor-1");
      expect((artifacts.content as BundleContentV2).floors?.[0]?.route).toBeDefined();
      expect((artifacts.content as BundleContentV2).floors?.[1]?.id).toBe("floor-2");
    });

    it("carries the floor cover image and translated names in v2", () => {
      const artifacts = buildTourBundleArtifacts(mockTourWithFloors, "2");
      const floors = (artifacts.content as BundleContentV2).floors;

      expect(floors?.[0]?.coverUrl).toBe(
        "https://cdn.example.com/floor-1-cover.jpg",
      );
      expect(floors?.[0]?.translations).toEqual([
        { language: "en", audience: "ADULTS", name: "Ground Floor" },
      ]);
      // A floor with no cover ships null, not a missing key.
      expect(floors?.[1]?.coverUrl).toBeNull();
    });

    it("should include map tile URLs in v2 format", () => {
      const artifacts = buildTourBundleArtifacts(mockTourWithFloors, "2");

      expect((artifacts.content as BundleContentV2).floors?.[0]?.mapTileUrl).toBe(
        "https://tiles.example.com/floor1/{z}/{x}/{y}.pbf",
      );
      expect((artifacts.content as BundleContentV2).floors?.[1]?.mapTileUrl).toBe(
        "https://tiles.example.com/floor2/{z}/{x}/{y}.pbf",
      );
    });
  });

  describe("v1 bundle format (backward compat)", () => {
    it("should build v1 bundle with single flattened route", () => {
      const artifacts = buildTourBundleArtifacts(mockTourWithFloors, "1");

      expect(artifacts.manifest.bundleFormatVersion).toBe("1");
      expect((artifacts.content as BundleContentV1).route).toBeDefined();
      expect((artifacts.content as BundleContentV2).floors).toBeUndefined();
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
