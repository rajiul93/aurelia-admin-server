import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import type { AppLanguage } from "@/lib/i18n/languages";
import { tourBundleService } from "@/modules/tour-bundle";
import { toTourDto, toTourDtoList } from "./tour.mapper";
import {
  getAvailableLifecycleActions,
  getTourReadiness,
  resolveLifecycleAuditAction,
  resolveLifecycleTransition,
  type TourLifecycleAction,
} from "./tour.publish";
import { tourRepository } from "./tour.repository";
import type {
  CreateTourInput,
  ListToursQuery,
  UpdateTourInput,
} from "./tour.schema";

function mapAuditTour(tour: Awaited<ReturnType<typeof tourRepository.findById>>) {
  if (!tour) {
    return null;
  }

  const allSpots = tour.floors.flatMap((floor) => floor.spots);

  return {
    id: tour.id,
    slug: tour.slug,
    placeId: tour.placeId,
    coverMediaId: tour.coverMediaId,
    publishStatus: tour.publishStatus,
    translations: tour.translations.map((entry) => ({
      language: entry.language,
      audience: entry.audience,
      title: entry.title,
      description: entry.description,
      slug: entry.slug,
    })),
    spots: allSpots.map((spot) => ({
      id: spot.id,
      sortOrder: spot.sortOrder,
      translations: spot.translations.map((entry) => ({
        language: entry.language,
        audience: entry.audience,
        title: entry.title,
        shortDesc: entry.shortDesc,
      })),
      mediaCount: spot.media.length,
      faqCount: spot.faqs.length,
    })),
  };
}

async function ensureUniqueSlug(slug: string, excludeId?: string) {
  const existing = await tourRepository.findBySlug(slug);

  if (existing && existing.id !== excludeId) {
    throw new ConflictError("A tour with this slug already exists");
  }
}

function mapTourForReadiness(
  tour: NonNullable<Awaited<ReturnType<typeof tourRepository.findById>>>,
) {
  const allSpots = tour.floors.flatMap((floor) =>
    floor.spots.map((spot) => ({
      id: spot.id,
      latitude: spot.latitude != null ? Number(spot.latitude) : null,
      longitude: spot.longitude != null ? Number(spot.longitude) : null,
      translations: spot.translations,
      media: spot.media,
      faqs: spot.faqs,
    })),
  );

  const route = tour.floors.find((floor) => floor.route)?.route ?? null;

  return {
    coverMediaId: tour.coverMediaId,
    translations: tour.translations,
    spots: allSpots,
    route,
    aiKnowledge: tour.aiKnowledge,
  };
}

export const tourService = {
  async list(query: ListToursQuery) {
    const { tours, total } = await tourRepository.findMany(query);

    return {
      data: toTourDtoList(tours, query.language as AppLanguage | undefined),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  },

  async getById(id: string, language?: AppLanguage) {
    const tour = await tourRepository.findById(id);
    if (!tour) {
      throw new NotFoundError("Tour not found");
    }

    return toTourDto(tour, language);
  },

  async create(input: CreateTourInput, audit?: AuditContext) {
    await ensureUniqueSlug(input.slug);

    const tour = await tourRepository.create({
      slug: input.slug,
      publishStatus: "DRAFT",
      ...(input.placeId
        ? { place: { connect: { id: input.placeId } } }
        : {}),
      coverMedia: { connect: { id: input.coverMediaId } },
      translations: {
        create: input.translations.map((translation) => ({
          audience: translation.audience,
          language: translation.language,
          title: translation.title,
          description: translation.description,
          slug: translation.slug,
        })),
      },
    });

    await auditService.log({
      module: "tour",
      actionType: "CREATE",
      entityId: tour.id,
      newValue: mapAuditTour(tour),
      context: audit,
    });

    return toTourDto(tour);
  },

  async update(id: string, input: UpdateTourInput, audit?: AuditContext) {
    const existing = await tourRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Tour not found");
    }

    if (input.slug) {
      await ensureUniqueSlug(input.slug, id);
    }

    const tour = await tourRepository.update(id, {
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.placeId !== undefined
        ? input.placeId
          ? { place: { connect: { id: input.placeId } } }
          : { place: { disconnect: true } }
        : {}),
      ...(input.coverMediaId !== undefined
        ? input.coverMediaId
          ? { coverMedia: { connect: { id: input.coverMediaId } } }
          : { coverMedia: { disconnect: true } }
        : {}),
      ...(input.translations
        ? {
            translations: {
              deleteMany: {},
              create: input.translations.map((translation) => ({
                audience: translation.audience,
                language: translation.language,
                title: translation.title,
                description: translation.description,
                slug: translation.slug,
              })),
            },
          }
        : {}),
    });

    await auditService.log({
      module: "tour",
      actionType: "UPDATE",
      entityId: tour.id,
      previousValue: mapAuditTour(existing),
      newValue: mapAuditTour(tour),
      context: audit,
    });

    return toTourDto(tour);
  },

  async getReadiness(id: string) {
    const tour = await tourRepository.findById(id);
    if (!tour) {
      throw new NotFoundError("Tour not found");
    }

    return {
      ...getTourReadiness(mapTourForReadiness(tour)),
      availableActions: getAvailableLifecycleActions(tour.publishStatus),
      publishStatus: tour.publishStatus,
    };
  },

  async transition(
    id: string,
    action: TourLifecycleAction,
    audit?: AuditContext,
  ) {
    const existing = await tourRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Tour not found");
    }

    const rule = resolveLifecycleTransition(existing.publishStatus, action);

    if (rule.requiresReady) {
      const readiness = getTourReadiness(mapTourForReadiness(existing));
      if (!readiness.ready) {
        const failed = readiness.checks
          .filter((check) => !check.ok)
          .map((check) => check.label)
          .join("; ");
        throw new ValidationError(`Tour is not ready to publish: ${failed}`);
      }
    }

    const now = new Date();
    const tour = await tourRepository.update(id, {
      publishStatus: rule.to,
      ...(rule.to === "PUBLISHED"
        ? {
            publishedAt: now,
            archivedAt: null,
            tourBundleVersion: { increment: 1 },
          }
        : {}),
      ...(rule.to === "ARCHIVED" ? { archivedAt: now } : {}),
      ...(action === "rollback" || action === "return_to_draft"
        ? { archivedAt: null }
        : {}),
    });

    await auditService.log({
      module: "tour",
      actionType: resolveLifecycleAuditAction(action),
      entityId: tour.id,
      previousValue: mapAuditTour(existing),
      newValue: {
        ...mapAuditTour(tour),
        lifecycleAction: action,
      },
      context: audit,
    });

    if (action === "approve_publish") {
      await tourBundleService.buildForTour(tour.id, audit);
    }

    return toTourDto(tour);
  },

  async delete(id: string, audit?: AuditContext) {
    const existing = await tourRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Tour not found");
    }

    await tourRepository.delete(id);

    await auditService.log({
      module: "tour",
      actionType: "DELETE",
      entityId: id,
      previousValue: mapAuditTour(existing),
      context: audit,
    });
  },
};
