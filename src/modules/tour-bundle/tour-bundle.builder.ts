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
  const spotPoints = tour.spots.flatMap((spot) =>
    spot.latitude !== null && spot.longitude !== null
      ? [{ lat: Number(spot.latitude), lng: Number(spot.longitude) }]
      : [],
  );
  const footprintPointsList = (tour.route?.edges ?? []).flatMap((edge) =>
    footprintPoints(edge.footprintGeo) ?? [],
  );
  const allPoints = [...spotPoints, ...footprintPointsList];
  const hasCompleteCoordinates =
    tour.spots.length > 0 &&
    tour.spots.every(
      (spot) => spot.latitude !== null && spot.longitude !== null,
    );
  const expectedEdges = Math.max(tour.spots.length - 1, 0);
  const edges = tour.route?.edges ?? [];
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

function buildContentPayload(tour: TourWithBundleRelations) {
  const tourDto = toTourDto(tour);

  return {
    tour: tourDto,
    route: tour.route
      ? {
          id: tour.route.id,
          edges: tour.route.edges.map((edge) => ({
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

  for (const spot of tour.spots) {
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

function fileEntry(path: string, payload: unknown): BundleManifestFile {
  const body = toCanonicalJson(payload);

  return {
    path,
    checksum: checksumJson(payload),
    size: Buffer.byteLength(body, "utf8"),
  };
}

export function buildTourBundleArtifacts(tour: TourWithBundleRelations) {
  const bundleId = randomUUID();
  const createdAt = new Date().toISOString();
  const languages = [...APP_LANGUAGES];
  const content = buildContentPayload(tour);
  const searchDocuments = buildSearchDocuments(tour);

  const files = [
    fileEntry("content.json", content),
    fileEntry("search/documents.json", { documents: searchDocuments }),
  ];

  const manifestBody = {
    version: String(tour.tourBundleVersion),
    bundleId,
    tourId: tour.id,
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
