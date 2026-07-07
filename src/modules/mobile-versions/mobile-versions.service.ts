import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import type { MobileSessionContext } from "@/lib/mobile/require-mobile";
import { prisma } from "@/lib/prisma";

export const mobileVersionsService = {
  async getPublicVersions() {
    const config = await appReleaseRepository.getConfig();

    return {
      apiVersion: config.apiVersion,
      schemaVersion: config.schemaVersion,
      appContentVersion: config.appContentVersion,
      knowledgeVersion: config.knowledgeVersion,
      remoteConfigVersion: config.remoteConfigVersion,
    };
  },

  async getEntitledVersions(session: MobileSessionContext) {
    const publicVersions = await this.getPublicVersions();

    const access = await prisma.tourAccess.findUnique({
      where: { id: session.tourAccessId },
      include: {
        tours: {
          include: {
            tour: {
              select: {
                id: true,
                slug: true,
                publishStatus: true,
                tourBundleVersion: true,
                mediaVersion: true,
                aiKnowledgeVersion: true,
                routeVersion: true,
              },
            },
          },
        },
      },
    });

    const tours =
      access?.tours
        .filter((entry) => entry.tour.publishStatus === "PUBLISHED")
        .map((entry) => ({
          tourId: entry.tour.id,
          slug: entry.tour.slug,
          tourBundleVersion: entry.tour.tourBundleVersion,
          mediaVersion: entry.tour.mediaVersion,
          aiKnowledgeVersion: entry.tour.aiKnowledgeVersion,
          routeVersion: entry.tour.routeVersion,
        })) ?? [];

    return {
      ...publicVersions,
      tours,
    };
  },
};
