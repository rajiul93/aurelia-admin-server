import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { tourIncludeRelations } from "@/modules/tour/tour.repository";

export const tourBundleInclude = {
  ...tourIncludeRelations,
  aiKnowledge: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      translations: {
        orderBy: { language: "asc" as const },
      },
    },
  },
} satisfies Prisma.TourInclude;

export type TourWithBundleRelations = NonNullable<
  Awaited<ReturnType<typeof tourBundleRepository.findTourForBundle>>
>;

export const tourBundleRepository = {
  findTourForBundle(tourId: string) {
    return prisma.tour.findUnique({
      where: { id: tourId },
      include: tourBundleInclude,
    });
  },

  findLatestByTourId(tourId: string) {
    return prisma.tourBundle.findFirst({
      where: { tourId },
      orderBy: [{ tourBundleVersion: "desc" }, { createdAt: "desc" }],
    });
  },

  findByTourAndVersion(tourId: string, tourBundleVersion: number) {
    return prisma.tourBundle.findUnique({
      where: {
        tourId_tourBundleVersion: { tourId, tourBundleVersion },
      },
    });
  },

  create(data: Prisma.TourBundleCreateInput) {
    return prisma.tourBundle.create({ data });
  },

  updateArtifacts(
    id: string,
    data: {
      bundleId: string;
      mediaVersion: number;
      aiKnowledgeVersion: number;
      routeVersion: number;
      languages: string[];
      manifest: unknown;
      content: unknown;
      searchDocuments: unknown;
      checksum: string;
      signature: string;
      signatureAlgorithm: string;
      fileCount: number;
    },
  ) {
    return prisma.tourBundle.update({
      where: { id },
      data: {
        bundleId: data.bundleId,
        mediaVersion: data.mediaVersion,
        aiKnowledgeVersion: data.aiKnowledgeVersion,
        routeVersion: data.routeVersion,
        languages: data.languages,
        manifest: data.manifest as never,
        content: data.content as never,
        searchDocuments: data.searchDocuments as never,
        checksum: data.checksum,
        signature: data.signature,
        signatureAlgorithm: data.signatureAlgorithm,
        fileCount: data.fileCount,
      },
    });
  },
};
