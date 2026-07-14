import type { Prisma } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { tourRepository } from "@/modules/tour/tour.repository";
import { toSpotDto, toSpotDtoList } from "./spot.mapper";
import { spotRepository } from "./spot.repository";
import type {
  CreateSpotFaqInput,
  CreateSpotInput,
  CreateSpotMediaInput,
  UpdateSpotFaqInput,
  UpdateSpotInput,
} from "./spot.schema";

async function ensureTourExists(tourId: string) {
  const tour = await tourRepository.findById(tourId);
  if (!tour) {
    throw new NotFoundError("Tour not found");
  }

  return tour;
}

async function ensureSpot(tourId: string, floorId: string, spotId: string) {
  const spot = await spotRepository.findById(tourId, floorId, spotId);
  if (!spot) {
    throw new NotFoundError("Spot not found");
  }

  return spot;
}

function mapAuditSpot(spot: Awaited<ReturnType<typeof spotRepository.findById>>) {
  if (!spot) {
    return null;
  }

  return {
    id: spot.id,
    floorId: spot.floorId,
    sortOrder: spot.sortOrder,
    latitude: spot.latitude,
    longitude: spot.longitude,
    includedInQuickTour: spot.includedInQuickTour,
    translations: spot.translations.map((entry) => ({
      language: entry.language,
      audience: entry.audience,
      title: entry.title,
      shortDesc: entry.shortDesc,
    })),
    mediaCount: spot.media.length,
    faqCount: spot.faqs.length,
  };
}

function mapAuditMedia(media: {
  id: string;
  type: string;
  sortOrder: number;
  language: string | null;
  audience: string;
  mediaId: string;
}) {
  return {
    id: media.id,
    type: media.type,
    sortOrder: media.sortOrder,
    language: media.language,
    audience: media.audience,
    mediaId: media.mediaId,
  };
}

function mapAuditFaq(faq: {
  id: string;
  sortOrder: number;
  translations: Array<{
    language: string;
    audience: string;
    question: string;
  }>;
}) {
  return {
    id: faq.id,
    sortOrder: faq.sortOrder,
    translations: faq.translations.map((entry) => ({
      language: entry.language,
      audience: entry.audience,
      question: entry.question,
    })),
  };
}

export const spotService = {
  // New: list by floor
  async listByFloor(floorId: string) {
    const spots = await spotRepository.findByFloorId(floorId);
    return toSpotDtoList(spots);
  },

  // Deprecated: kept for backward compat
  async listByTour(tourId: string) {
    await ensureTourExists(tourId);
    const spots = await spotRepository.findByTourId(tourId);
    return toSpotDtoList(spots);
  },

  // New: get with floor validation
  async getById(tourId: string, floorId: string, spotId: string) {
    const spot = await ensureSpot(tourId, floorId, spotId);
    return toSpotDto(spot);
  },

  // New: create in floor
  async create(floorId: string, input: CreateSpotInput, audit?: AuditContext) {
    const spot = await spotRepository.create(floorId, {
      sortOrder: input.sortOrder,
      latitude: input.latitude,
      longitude: input.longitude,
      includedInQuickTour: input.includedInQuickTour,
      translations: {
        create: input.translations.map((translation) => ({
          audience: translation.audience,
          language: translation.language,
          title: translation.title,
          shortDesc: translation.shortDesc,
          quillJson: translation.quillJson as Prisma.InputJsonValue,
          descriptionHtml: translation.descriptionHtml,
          descriptionText: translation.descriptionText,
        })),
      },
    });

    await auditService.log({
      module: "spot",
      actionType: "CREATE",
      entityId: spot.id,
      newValue: mapAuditSpot(spot),
      context: audit,
    });

    return toSpotDto(spot);
  },

  async update(
    tourId: string,
    floorId: string,
    spotId: string,
    input: UpdateSpotInput,
    audit?: AuditContext,
  ) {
    const existing = await ensureSpot(tourId, floorId, spotId);

    const spot = await spotRepository.update(spotId, {
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
      ...(input.includedInQuickTour !== undefined
        ? { includedInQuickTour: input.includedInQuickTour }
        : {}),
      ...(input.translations
        ? {
            translations: {
              deleteMany: {},
              create: input.translations.map((translation) => ({
                audience: translation.audience,
                language: translation.language,
                title: translation.title,
                shortDesc: translation.shortDesc,
                quillJson: translation.quillJson as Prisma.InputJsonValue,
                descriptionHtml: translation.descriptionHtml,
                descriptionText: translation.descriptionText,
              })),
            },
          }
        : {}),
    });

    await auditService.log({
      module: "spot",
      actionType: "UPDATE",
      entityId: spot.id,
      previousValue: mapAuditSpot(existing),
      newValue: mapAuditSpot(spot),
      context: audit,
    });

    return toSpotDto(spot);
  },

  async delete(tourId: string, floorId: string, spotId: string, audit?: AuditContext) {
    const existing = await ensureSpot(tourId, floorId, spotId);
    await spotRepository.delete(spotId);

    await auditService.log({
      module: "spot",
      actionType: "DELETE",
      entityId: spotId,
      previousValue: mapAuditSpot(existing),
      context: audit,
    });
  },

  async createMedia(
    tourId: string,
    floorId: string,
    spotId: string,
    input: CreateSpotMediaInput,
    audit?: AuditContext,
  ) {
    await ensureSpot(tourId, floorId, spotId);

    const media = await spotRepository.createMedia(tourId, floorId, spotId, {
      type: input.type,
      mediaId: input.mediaId,
      thumbnailMediaId: input.thumbnailMediaId ?? null,
      sortOrder: input.sortOrder,
      language: input.language,
      audience: input.audience,
      includedInQuickTour: input.includedInQuickTour,
    });

    await auditService.log({
      module: "spot-media",
      actionType: "CREATE",
      entityId: media.id,
      newValue: mapAuditMedia(media),
      context: audit,
    });

    return media;
  },

  async deleteMedia(
    tourId: string,
    _floorId: string,
    spotId: string,
    mediaId: string,
    audit?: AuditContext,
  ) {
    const media = await spotRepository.findMedia(tourId, spotId, mediaId);
    if (!media) {
      throw new NotFoundError("Media not found");
    }

    await spotRepository.deleteMedia(tourId, mediaId);

    await auditService.log({
      module: "spot-media",
      actionType: "DELETE",
      entityId: mediaId,
      previousValue: mapAuditMedia(media),
      context: audit,
    });
  },

  async createFaq(
    tourId: string,
    floorId: string,
    spotId: string,
    input: CreateSpotFaqInput,
    audit?: AuditContext,
  ) {
    await ensureSpot(tourId, floorId, spotId);

    const faq = await spotRepository.createFaq(spotId, {
      sortOrder: input.sortOrder,
      translations: input.translations.map((translation) => ({
        audience: translation.audience,
        language: translation.language,
        question: translation.question,
        answerHtml: translation.answerHtml,
        answerText: translation.answerText,
        answerJson: translation.answerJson as Prisma.InputJsonValue,
      })),
    });

    await auditService.log({
      module: "spot-faq",
      actionType: "CREATE",
      entityId: faq.id,
      newValue: mapAuditFaq(faq),
      context: audit,
    });

    return faq;
  },

  async updateFaq(
    tourId: string,
    floorId: string,
    spotId: string,
    faqId: string,
    input: UpdateSpotFaqInput,
    audit?: AuditContext,
  ) {
    const existing = await spotRepository.findFaq(spotId, faqId);
    if (!existing) {
      throw new NotFoundError("FAQ not found");
    }

    await ensureSpot(tourId, floorId, spotId);

    const faq = await spotRepository.updateFaq(faqId, {
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.translations
        ? {
            translations: {
              deleteMany: {},
              create: input.translations.map((translation) => ({
                audience: translation.audience,
                language: translation.language,
                question: translation.question,
                answerHtml: translation.answerHtml,
                answerText: translation.answerText,
                answerJson: translation.answerJson as Prisma.InputJsonValue,
              })),
            },
          }
        : {}),
    });

    await auditService.log({
      module: "spot-faq",
      actionType: "UPDATE",
      entityId: faq.id,
      previousValue: mapAuditFaq(existing),
      newValue: mapAuditFaq(faq),
      context: audit,
    });

    return faq;
  },

  async deleteFaq(
    _tourId: string,
    _floorId: string,
    spotId: string,
    faqId: string,
    audit?: AuditContext,
  ) {
    const faq = await spotRepository.findFaq(spotId, faqId);
    if (!faq) {
      throw new NotFoundError("FAQ not found");
    }

    await spotRepository.deleteFaq(faqId);

    await auditService.log({
      module: "spot-faq",
      actionType: "DELETE",
      entityId: faqId,
      previousValue: mapAuditFaq(faq),
      context: audit,
    });
  },
};
