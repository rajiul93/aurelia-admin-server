import type { TourBundle } from "@/generated/prisma/client";
import type {
  BundleManifest,
  SearchDocument,
  TourBundleDetailDto,
  TourBundleDto,
} from "./tour-bundle.types";

function asLanguages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

export function toTourBundleDto(record: TourBundle): TourBundleDto {
  return {
    id: record.id,
    tourId: record.tourId,
    bundleId: record.bundleId,
    tourBundleVersion: record.tourBundleVersion,
    mediaVersion: record.mediaVersion,
    aiKnowledgeVersion: record.aiKnowledgeVersion,
    routeVersion: record.routeVersion,
    languages: asLanguages(record.languages),
    manifest: record.manifest as BundleManifest,
    checksum: record.checksum,
    signature: record.signature,
    signatureAlgorithm: record.signatureAlgorithm,
    fileCount: record.fileCount,
    createdAt: record.createdAt.toISOString(),
  };
}

export function toTourBundleDetailDto(record: TourBundle): TourBundleDetailDto {
  return {
    ...toTourBundleDto(record),
    content: record.content,
    searchDocuments: record.searchDocuments as SearchDocument[],
  };
}
