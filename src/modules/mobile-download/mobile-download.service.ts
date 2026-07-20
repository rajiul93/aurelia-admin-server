import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import type { MobileSessionContext } from "@/lib/mobile/require-mobile";
import { toTourBundleDetailDto } from "@/modules/tour-bundle/tour-bundle.mapper";
import { tourBundleRepository } from "@/modules/tour-bundle/tour-bundle.repository";
import { tourBundleService } from "@/modules/tour-bundle/tour-bundle.service";
import { prisma } from "@/lib/prisma";

async function assertTourEntitlement(
  session: MobileSessionContext,
  tourId: string,
) {
  const grant = await prisma.tourAccessTour.findUnique({
    where: {
      tourAccessId_tourId: {
        tourAccessId: session.tourAccessId,
        tourId,
      },
    },
    include: {
      tour: {
        select: { id: true, publishStatus: true },
      },
    },
  });

  if (!grant || grant.tour.publishStatus !== "PUBLISHED") {
    throw new ForbiddenError("You are not entitled to download this tour");
  }
}

async function ensureLatestBundle(tourId: string) {
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { publishStatus: true },
  });

  if (!tour || tour.publishStatus !== "PUBLISHED") {
    throw new NotFoundError("No signed bundle is available for this tour");
  }

  // No `force` here: this runs on every mobile download, and forcing meant a
  // full graph reload, re-sign and audit row per request. Staleness is already
  // covered — buildForTour looks the bundle up by tourBundleVersion and then
  // compares mediaVersion / aiKnowledgeVersion / routeVersion, all of which are
  // bumped on write, and publishStatus is re-checked just above.
  await tourBundleService.buildForTour(tourId);

  const bundle = await tourBundleRepository.findLatestByTourId(tourId);

  if (!bundle) {
    throw new NotFoundError("No signed bundle is available for this tour");
  }

  return bundle;
}

export const mobileDownloadService = {
  async getSignedBundle(session: MobileSessionContext, tourId: string) {
    await assertTourEntitlement(session, tourId);

    const bundle = await ensureLatestBundle(tourId);
    return toTourBundleDetailDto(bundle);
  },
};
