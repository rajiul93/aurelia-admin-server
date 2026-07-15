import { randomUUID } from "crypto";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { toCanonicalJson } from "@/lib/bundle/canonical-json";
import { checksumJson, signManifestBody } from "@/lib/bundle/sign";
import { toTourDto } from "@/modules/tour/tour.mapper";
import type { TourWithBundleRelations } from "./tour-bundle.repository";
import type {
  BundleManifest,
  BundleManifestFile,
  SearchDocument,
} from "./tour-bundle.types";

const SQLITE_SCHEMA_VERSION = "1";

function footprintPoints(value: unknown) {
  if (!Array.isArray(value)) {
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

function buildNavigationMetadata(tour: TourWithBundleRelations) {
  const allSpots = tour.floors?.flatMap((floor) => floor.spots) ?? [];
  const spotPoints = allSpots.flatMap((spot) =>
    spot.latitude !== null && spot.longitude !== null
      ? [{ lat: Number(spot.latitude), lng: Number(spot.longitude) }]
      : [],
  );
  // Collect edges from all floors
  const allEdges = tour.floors?.flatMap((floor) =>
    floor.route?.edges?.map((edge) => ({
      ...edge,
      footprintGeo: edge.footprintGeo,
    })) ?? [],
  ) ?? [];
  const footprintPointsList = allEdges.flatMap((edge) =>
    footprintPoints(edge.footprintGeo) ?? [],
  );
  const allPoints = [...spotPoints, ...footprintPointsList];
  const hasCompleteCoordinates =
    allSpots.length > 0 &&
    allSpots.every(
      (spot) => spot.latitude !== null && spot.longitude !== null,
    );
  const expectedEdges = Math.max(allSpots.length - 1, 0);
  const edges = allEdges;
  const hasCompleteFootprints =
    expectedEdges === 0 ||
    (edges.length >= expectedEdges &&
      edges.every((edge) => footprintPoints(edge.footprintGeo)));

  if (allPoints.length === 0) {
    return {
      mapBounds: null,
      hasCompleteFootprints,
      hasCompleteCoordinates,
    };
  }

  const north = Math.max(...allPoints.map((point) => point.lat)) + 0.002;
  const south = Math.min(...allPoints.map((point) => point.lat)) - 0.002;
  const east = Math.max(...allPoints.map((point) => point.lng)) + 0.002;
  const west = Math.min(...allPoints.map((point) => point.lng)) - 0.002;

  return {
    mapBounds: { north, south, east, west },
    hasCompleteFootprints,
    hasCompleteCoordinates,
  };
}

function buildContentPayloadV1(tour: TourWithBundleRelations) {
  const tourDto = toTourDto(tour);

  // V1: Flatten all routes into single route (backward compat)
  const allRoutes = tour.floors?.flatMap((floor) => floor.route ?? []) ?? [];
  const firstRoute = allRoutes[0];

  return {
    tour: tourDto,
    route: firstRoute
      ? {
          id: firstRoute.id,
          edges: firstRoute.edges.map((edge) => ({
            id: edge.id,
            fromSpotId: edge.fromSpotId,
            toSpotId: edge.toSpotId,
            sortOrder: edge.sortOrder,
            footprintGeo: footprintPoints(edge.footprintGeo),
          })),
        }
      : null,
    navigation: buildNavigationMetadata(tour),
    aiKnowledge: tour.aiKnowledge.map((entry) => ({
      id: entry.id,
      spotId: entry.spotId,
      sortOrder: entry.sortOrder,
      translations: entry.translations.map((translation) => ({
        language: translation.language,
        audience: translation.audience,
        title: translation.title,
        content: translation.content,
        keywords: translation.keywords,
      })),
    })),
    versions: {
      tourBundleVersion: tour.tourBundleVersion,
      mediaVersion: tour.mediaVersion,
      aiKnowledgeVersion: tour.aiKnowledgeVersion,
      routeVersion: tour.routeVersion,
      sqliteVersion: SQLITE_SCHEMA_VERSION,
    },
  };
}

function buildContentPayloadV2(tour: TourWithBundleRelations) {
  const tourDto = toTourDto(tour);

  // V2: Per-floor routes with proper hierarchy. Cover image and the translated
  // floor names ride along so the app can render a floor card offline.
  const floors = (tour.floors ?? []).map((floor) => ({
    id: floor.id,
    floorNo: floor.floorNo,
    coverUrl: floor.coverMedia?.url ?? null,
    translations: floor.translations.map((translation) => ({
      language: translation.language,
      audience: translation.audience,
      name: translation.name,
    })),
    route: floor.route
      ? {
          id: floor.route.id,
          edges: floor.route.edges.map((edge) => ({
            id: edge.id,
            fromSpotId: edge.fromSpotId,
            toSpotId: edge.toSpotId,
            sortOrder: edge.sortOrder,
            footprintGeo: footprintPoints(edge.footprintGeo),
          })),
        }
      : null,
  }));

  return {
    tour: tourDto,
    floors,
    navigation: buildNavigationMetadata(tour),
    aiKnowledge: tour.aiKnowledge.map((entry) => ({
      id: entry.id,
      spotId: entry.spotId,
      sortOrder: entry.sortOrder,
      translations: entry.translations.map((translation) => ({
        language: translation.language,
        audience: translation.audience,
        title: translation.title,
        content: translation.content,
        keywords: translation.keywords,
      })),
    })),
    versions: {
      tourBundleVersion: tour.tourBundleVersion,
      mediaVersion: tour.mediaVersion,
      aiKnowledgeVersion: tour.aiKnowledgeVersion,
      routeVersion: tour.routeVersion,
      sqliteVersion: SQLITE_SCHEMA_VERSION,
    },
  };
}


function buildSearchDocuments(
  tour: TourWithBundleRelations,
): SearchDocument[] {
  const documents: SearchDocument[] = [];

  for (const translation of tour.translations) {
    documents.push({
      id: `tour:${tour.id}:${translation.language}:${translation.audience}`,
      language: translation.language,
      audience: translation.audience,
      type: "tour",
      tourId: tour.id,
      spotId: null,
      title: translation.title,
      body: translation.description,
      keywords: tour.slug,
    });
  }

  const allSpots = tour.floors?.flatMap((floor) => floor.spots) ?? [];
  for (const spot of allSpots) {
    for (const translation of spot.translations) {
      documents.push({
        id: `spot:${spot.id}:${translation.language}:${translation.audience}`,
        language: translation.language,
        audience: translation.audience,
        type: "spot",
        tourId: tour.id,
        spotId: spot.id,
        title: translation.title,
        body: [translation.shortDesc, translation.descriptionText]
          .filter(Boolean)
          .join("\n"),
        keywords: "",
      });
    }

    for (const faq of spot.faqs) {
      for (const translation of faq.translations) {
        documents.push({
          id: `spot_faq:${faq.id}:${translation.language}:${translation.audience}`,
          language: translation.language,
          audience: translation.audience,
          type: "spot_faq",
          tourId: tour.id,
          spotId: spot.id,
          title: translation.question,
          body: translation.answerText,
          keywords: "",
        });
      }
    }
  }

  for (const knowledge of tour.aiKnowledge) {
    for (const translation of knowledge.translations) {
      documents.push({
        id: `ai_knowledge:${knowledge.id}:${translation.language}:${translation.audience}`,
        language: translation.language,
        audience: translation.audience,
        type: "ai_knowledge",
        tourId: tour.id,
        spotId: knowledge.spotId,
        title: translation.title || translation.content.slice(0, 80),
        body: translation.content,
        keywords: translation.keywords,
      });
    }
  }

  return documents;
}

export type BundleContentV1 = ReturnType<typeof buildContentPayloadV1>;
export type BundleContentV2 = ReturnType<typeof buildContentPayloadV2>;

function fileEntry(path: string, payload: unknown): BundleManifestFile {
  const body = toCanonicalJson(payload);

  return {
    path,
    checksum: checksumJson(payload),
    size: Buffer.byteLength(body, "utf8"),
  };
}

export function buildTourBundleArtifacts(tour: TourWithBundleRelations, bundleFormatVersion: "1" | "2" = "2") {
  const bundleId = randomUUID();
  const createdAt = new Date().toISOString();
  const languages = [...APP_LANGUAGES];

  const content = bundleFormatVersion === "1"
    ? buildContentPayloadV1(tour)
    : buildContentPayloadV2(tour);

  const searchDocuments = buildSearchDocuments(tour);

  const files = [
    fileEntry("content.json", content),
    fileEntry("search/documents.json", { documents: searchDocuments }),
  ];

  const manifestBody = {
    version: String(tour.tourBundleVersion),
    bundleId,
    tourId: tour.id,
    bundleFormatVersion,
    createdAt,
    languages,
    tourBundleVersion: tour.tourBundleVersion,
    mediaVersion: tour.mediaVersion,
    aiKnowledgeVersion: tour.aiKnowledgeVersion,
    routeVersion: tour.routeVersion,
    sqliteVersion: SQLITE_SCHEMA_VERSION,
    files,
  };

  const packageChecksum = checksumJson(manifestBody);
  const signed = signManifestBody({
    ...manifestBody,
    checksum: packageChecksum,
  });

  const manifest: BundleManifest = {
    ...manifestBody,
    checksum: packageChecksum,
    signature: signed.signature,
    signatureAlgorithm: signed.algorithm,
  };

  return {
    bundleId,
    languages,
    manifest,
    content,
    searchDocuments,
    checksum: packageChecksum,
    signature: signed.signature,
    signatureAlgorithm: signed.algorithm,
    fileCount: files.length + 1,
  };
}
