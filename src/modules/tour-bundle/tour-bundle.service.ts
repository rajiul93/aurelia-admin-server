import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { buildTourBundleArtifacts } from "./tour-bundle.builder";
import { getBundleFormatVersion, type BundleFormatVersion } from "./tour-bundle.negotiation";
import {
  toTourBundleDetailDto,
  toTourBundleDto,
} from "./tour-bundle.mapper";
import { tourBundleRepository } from "./tour-bundle.repository";

export const tourBundleService = {
  async getLatest(tourId: string) {
    const record = await tourBundleRepository.findLatestByTourId(tourId);
    if (!record) {
      throw new NotFoundError("No bundle built for this tour yet");
    }

    return toTourBundleDto(record);
  },

  async getLatestDetail(tourId: string) {
    const record = await tourBundleRepository.findLatestByTourId(tourId);
    if (!record) {
      throw new NotFoundError("No bundle built for this tour yet");
    }

    return toTourBundleDetailDto(record);
  },

  async buildForTour(
    tourId: string,
    audit?: AuditContext,
    options?: { force?: boolean; bundleFormatVersion?: BundleFormatVersion; clientApiVersion?: string },
  ) {
    const tour = await tourBundleRepository.findTourForBundle(tourId);
    if (!tour) {
      throw new NotFoundError("Tour not found");
    }

    if (tour.publishStatus !== "PUBLISHED") {
      throw new ValidationError("Only published tours can build a bundle");
    }

    const existing = await tourBundleRepository.findByTourAndVersion(
      tourId,
      tour.tourBundleVersion,
    );

    // Determine bundle format version: explicit > negotiated > default (v2)
    const formatVersion = options?.bundleFormatVersion ??
      getBundleFormatVersion(options?.clientApiVersion) ??
      "2";

    const artifacts = buildTourBundleArtifacts(tour, formatVersion);

    const bundleIsCurrent =
      !options?.force &&
      existing &&
      existing.aiKnowledgeVersion === tour.aiKnowledgeVersion &&
      existing.mediaVersion === tour.mediaVersion &&
      existing.routeVersion === tour.routeVersion;

    if (existing && bundleIsCurrent) {
      return toTourBundleDto(existing);
    }

    if (existing) {
      const record = await tourBundleRepository.updateArtifacts(existing.id, {
        bundleId: artifacts.bundleId,
        mediaVersion: tour.mediaVersion,
        aiKnowledgeVersion: tour.aiKnowledgeVersion,
        routeVersion: tour.routeVersion,
        languages: artifacts.languages,
        manifest: artifacts.manifest,
        content: artifacts.content,
        searchDocuments: artifacts.searchDocuments,
        checksum: artifacts.checksum,
        signature: artifacts.signature,
        signatureAlgorithm: artifacts.signatureAlgorithm,
        fileCount: artifacts.fileCount,
      });

      await auditService.log({
        module: "tour-bundle",
        actionType: "UPDATE",
        entityId: record.id,
        previousValue: {
          bundleId: existing.bundleId,
          checksum: existing.checksum,
          aiKnowledgeVersion: existing.aiKnowledgeVersion,
          mediaVersion: existing.mediaVersion,
          routeVersion: existing.routeVersion,
        },
        newValue: {
          bundleId: record.bundleId,
          checksum: record.checksum,
          aiKnowledgeVersion: record.aiKnowledgeVersion,
          mediaVersion: record.mediaVersion,
          routeVersion: record.routeVersion,
        },
        context: audit,
      });

      return toTourBundleDto(record);
    }

    const record = await tourBundleRepository.create({
      tour: { connect: { id: tourId } },
      bundleId: artifacts.bundleId,
      tourBundleVersion: tour.tourBundleVersion,
      mediaVersion: tour.mediaVersion,
      aiKnowledgeVersion: tour.aiKnowledgeVersion,
      routeVersion: tour.routeVersion,
      languages: artifacts.languages,
      manifest: artifacts.manifest,
      content: artifacts.content as never,
      searchDocuments: artifacts.searchDocuments,
      checksum: artifacts.checksum,
      signature: artifacts.signature,
      signatureAlgorithm: artifacts.signatureAlgorithm,
      fileCount: artifacts.fileCount,
    });

    await auditService.log({
      module: "tour-bundle",
      actionType: "PUBLISH",
      entityId: record.id,
      newValue: {
        bundleId: record.bundleId,
        tourId: record.tourId,
        tourBundleVersion: record.tourBundleVersion,
        checksum: record.checksum,
        signatureAlgorithm: record.signatureAlgorithm,
        fileCount: record.fileCount,
      },
      context: audit,
    });

    return toTourBundleDto(record);
  },
};
