import { prisma } from "@/lib/prisma";
import type { MobileSessionContext } from "@/lib/mobile/require-mobile";

export const mobileEntitlementsService = {
  async getForSession(session: MobileSessionContext) {
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
                translations: {
                  select: { language: true, title: true },
                },
              },
            },
          },
        },
        deviceSessions: {
          where: { revokedAt: null },
        },
      },
    });

    if (!access) {
      return {
        email: session.email,
        status: "REVOKED",
        expiresAt: session.expiresAt.toISOString(),
        ticketCount: session.ticketCount,
        activeDeviceCount: 0,
        seatsRemaining: 0,
        allowSubscriptionFeatures: false,
        tours: [],
      };
    }

    const activeDeviceCount = access.deviceSessions.length;

    return {
      email: access.email,
      status: access.status,
      expiresAt: access.expiresAt.toISOString(),
      ticketCount: access.ticketCount,
      activeDeviceCount,
      seatsRemaining: Math.max(access.ticketCount - activeDeviceCount, 0),
      allowSubscriptionFeatures: access.allowSubscriptionFeatures,
      tours: access.tours
        .filter((entry) => entry.tour.publishStatus === "PUBLISHED")
        .map((entry) => ({
          id: entry.tour.id,
          slug: entry.tour.slug,
          title:
            entry.tour.translations.find((item) => item.language === "en")
              ?.title ?? entry.tour.slug,
          tourBundleVersion: entry.tour.tourBundleVersion,
          mediaVersion: entry.tour.mediaVersion,
          aiKnowledgeVersion: entry.tour.aiKnowledgeVersion,
          routeVersion: entry.tour.routeVersion,
        })),
    };
  },
};
