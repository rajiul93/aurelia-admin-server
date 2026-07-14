import type { Language, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const spotIncludeRelations = {
  translations: { orderBy: { language: "asc" as const } },
  faqs: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      translations: { orderBy: { language: "asc" as const } },
    },
  },
  media: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      media: true,
      thumbnailMedia: true,
    },
  },
} satisfies Prisma.SpotInclude;

export const spotRepository = {
  // New: find by floor (not tour)
  async findByFloorId(floorId: string) {
    return prisma.spot.findMany({
      where: { floorId },
      include: spotIncludeRelations,
      orderBy: { sortOrder: "asc" },
    });
  },

  // Deprecated: find by tour ID (aggregates across all floors in tour)
  async findByTourId(tourId: string) {
    return prisma.spot.findMany({
      where: {
        floor: { tourId },
      },
      include: spotIncludeRelations,
      orderBy: { sortOrder: "asc" },
    });
  },

  // New: validate floor → tour chain
  async findById(tourId: string, floorId: string, spotId: string) {
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { floor: { include: { tour: true } } },
    });

    if (!spot) return null;
    if (spot.floorId !== floorId) return null;
    if (spot.floor.tourId !== tourId) return null;

    return prisma.spot.findUnique({
      where: { id: spotId },
      include: spotIncludeRelations,
    });
  },

  // Alternative: find by tour + spotId (without floor)
  async findByTourAndId(tourId: string, spotId: string) {
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { floor: { include: { tour: true } } },
    });

    if (!spot || spot.floor.tourId !== tourId) {
      return null;
    }

    return prisma.spot.findUnique({
      where: { id: spotId },
      include: spotIncludeRelations,
    });
  },

  // New: create with floor FK
  async create(floorId: string, data: Omit<Prisma.SpotCreateInput, "floor">) {
    return prisma.spot.create({
      data: {
        floor: { connect: { id: floorId } },
        ...data,
      },
      include: spotIncludeRelations,
    });
  },

  update(spotId: string, data: Prisma.SpotUpdateInput) {
    return prisma.spot.update({
      where: { id: spotId },
      data,
      include: spotIncludeRelations,
    });
  },

  delete(spotId: string) {
    return prisma.spot.delete({ where: { id: spotId } });
  },

  async createMedia(
    tourId: string,
    floorId: string,
    spotId: string,
    data: {
      type: Prisma.TourMediaCreateInput["type"];
      mediaId: string;
      thumbnailMediaId?: string | null;
      sortOrder: number;
      language: Language;
      audience?: Prisma.TourMediaCreateInput["audience"];
      includedInQuickTour?: boolean;
    },
  ) {
    // Validate chain: spot belongs to floor, floor belongs to tour
    const spot = await prisma.spot.findUnique({
      where: { id: spotId },
      include: { floor: true },
    });
    if (!spot || spot.floorId !== floorId) {
      throw new Error("Spot not found in this floor");
    }
    if (spot.floor.tourId !== tourId) {
      throw new Error("Floor does not belong to this tour");
    }

    return prisma.$transaction(async (tx) => {
      const media = await tx.tourMedia.create({
        data: {
          tourId,
          spotId,
          type: data.type,
          mediaId: data.mediaId,
          thumbnailMediaId: data.thumbnailMediaId ?? null,
          sortOrder: data.sortOrder,
          language: data.language,
          audience: data.audience ?? "ADULTS",
          includedInQuickTour: data.includedInQuickTour ?? true,
        },
        include: { media: true, thumbnailMedia: true },
      });

      await tx.tour.update({
        where: { id: tourId },
        data: { mediaVersion: { increment: 1 } },
      });

      return media;
    });
  },

  findMedia(tourId: string, spotId: string, mediaId: string) {
    return prisma.tourMedia.findFirst({
      where: { id: mediaId, tourId, spotId },
      include: { media: true, thumbnailMedia: true },
    });
  },

  updateMedia(mediaId: string, data: Prisma.TourMediaUpdateInput) {
    return prisma.tourMedia.update({
      where: { id: mediaId },
      data,
      include: { media: true, thumbnailMedia: true },
    });
  },

  deleteMedia(tourId: string, mediaId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.tourMedia.delete({ where: { id: mediaId } });

      await tx.tour.update({
        where: { id: tourId },
        data: { mediaVersion: { increment: 1 } },
      });
    });
  },

  createFaq(
    spotId: string,
    data: {
      sortOrder: number;
      translations: Array<{
        language: Language;
        audience: Prisma.SpotFaqTranslationCreateWithoutSpotFaqInput["audience"];
        question: string;
        answerHtml: string;
        answerText: string;
        answerJson: Prisma.InputJsonValue;
      }>;
    },
  ) {
    return prisma.spotFaq.create({
      data: {
        spotId,
        sortOrder: data.sortOrder,
        translations: {
          create: data.translations,
        },
      },
      include: {
        translations: { orderBy: { language: "asc" } },
      },
    });
  },

  findFaq(spotId: string, faqId: string) {
    return prisma.spotFaq.findFirst({
      where: { id: faqId, spotId },
      include: {
        translations: { orderBy: { language: "asc" } },
      },
    });
  },

  updateFaq(faqId: string, data: Prisma.SpotFaqUpdateInput) {
    return prisma.spotFaq.update({
      where: { id: faqId },
      data,
      include: {
        translations: { orderBy: { language: "asc" } },
      },
    });
  },

  deleteFaq(faqId: string) {
    return prisma.spotFaq.delete({ where: { id: faqId } });
  },
};
