import { NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import { hostRepository } from "@/modules/host/host.repository";
import { toHostDtoList } from "@/modules/host/host.mapper";

export const mobileHostService = {
  async listByTour(tourId: string) {
    // Confirm the tour exists and is published (mobile can only see published tours)
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: { id: true, publishStatus: true },
    });

    if (!tour) {
      throw new NotFoundError("Tour not found");
    }

    if (tour.publishStatus !== "PUBLISHED") {
      throw new NotFoundError("Tour not found");
    }

    const [hosts, venueTimezone] = await Promise.all([
      hostRepository.findByTourId(tourId),
      appReleaseRepository.getVenueTimezone(),
    ]);
    return toHostDtoList(hosts, venueTimezone);
  },
};
