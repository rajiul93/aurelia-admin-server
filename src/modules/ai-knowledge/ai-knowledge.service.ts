import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { spotRepository } from "@/modules/spot/spot.repository";
import { tourRepository } from "@/modules/tour/tour.repository";
import {
  toAiKnowledgeDto,
  toAiKnowledgeDtoList,
} from "./ai-knowledge.mapper";
import { aiKnowledgeRepository } from "./ai-knowledge.repository";
import type {
  CreateAiKnowledgeInput,
  UpdateAiKnowledgeInput,
} from "./ai-knowledge.schema";

async function ensureTourExists(tourId: string) {
  const tour = await tourRepository.findById(tourId);
  if (!tour) {
    throw new NotFoundError("Tour not found");
  }

  return tour;
}

async function ensureSpotOptional(tourId: string, spotId: string | null) {
  if (!spotId) {
    return;
  }

  const spot = await spotRepository.findById(tourId, spotId);
  if (!spot) {
    throw new ValidationError("Spot not found on this tour");
  }
}

function mapAuditKnowledge(
  knowledge: Awaited<ReturnType<typeof aiKnowledgeRepository.findById>>,
) {
  if (!knowledge) {
    return null;
  }

  return {
    id: knowledge.id,
    tourId: knowledge.tourId,
    spotId: knowledge.spotId,
    sortOrder: knowledge.sortOrder,
    translations: knowledge.translations.map((entry) => ({
      language: entry.language,
      audience: entry.audience,
      title: entry.title,
      content: entry.content,
      keywords: entry.keywords,
    })),
  };
}

export const aiKnowledgeService = {
  async listByTour(tourId: string) {
    await ensureTourExists(tourId);
    const records = await aiKnowledgeRepository.findByTourId(tourId);
    return toAiKnowledgeDtoList(records);
  },

  async getById(tourId: string, knowledgeId: string) {
    const knowledge = await aiKnowledgeRepository.findById(tourId, knowledgeId);
    if (!knowledge) {
      throw new NotFoundError("AI knowledge entry not found");
    }

    return toAiKnowledgeDto(knowledge);
  },

  async create(
    tourId: string,
    input: CreateAiKnowledgeInput,
    audit?: AuditContext,
  ) {
    await ensureTourExists(tourId);
    await ensureSpotOptional(tourId, input.spotId);

    const knowledge = await aiKnowledgeRepository.create(tourId, {
      sortOrder: input.sortOrder,
      ...(input.spotId
        ? { spot: { connect: { id: input.spotId } } }
        : {}),
      translations: {
        create: input.translations.map((translation) => ({
          audience: translation.audience,
          language: translation.language,
          title: translation.title,
          content: translation.content,
          keywords: translation.keywords,
        })),
      },
    });

    await auditService.log({
      module: "ai-knowledge",
      actionType: "CREATE",
      entityId: knowledge.id,
      newValue: mapAuditKnowledge(knowledge),
      context: audit,
    });

    return toAiKnowledgeDto(knowledge);
  },

  async update(
    tourId: string,
    knowledgeId: string,
    input: UpdateAiKnowledgeInput,
    audit?: AuditContext,
  ) {
    const existing = await aiKnowledgeRepository.findById(tourId, knowledgeId);
    if (!existing) {
      throw new NotFoundError("AI knowledge entry not found");
    }

    if (input.spotId !== undefined) {
      await ensureSpotOptional(tourId, input.spotId);
    }

    const knowledge = await aiKnowledgeRepository.update(tourId, knowledgeId, {
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.spotId !== undefined
        ? input.spotId
          ? { spot: { connect: { id: input.spotId } } }
          : { spot: { disconnect: true } }
        : {}),
      ...(input.translations
        ? {
            translations: {
              deleteMany: {},
              create: input.translations.map((translation) => ({
                audience: translation.audience,
                language: translation.language,
                title: translation.title,
                content: translation.content,
                keywords: translation.keywords,
              })),
            },
          }
        : {}),
    });

    await auditService.log({
      module: "ai-knowledge",
      actionType: "UPDATE",
      entityId: knowledge.id,
      previousValue: mapAuditKnowledge(existing),
      newValue: mapAuditKnowledge(knowledge),
      context: audit,
    });

    return toAiKnowledgeDto(knowledge);
  },

  async delete(tourId: string, knowledgeId: string, audit?: AuditContext) {
    const existing = await aiKnowledgeRepository.findById(tourId, knowledgeId);
    if (!existing) {
      throw new NotFoundError("AI knowledge entry not found");
    }

    await aiKnowledgeRepository.delete(tourId, knowledgeId);

    await auditService.log({
      module: "ai-knowledge",
      actionType: "DELETE",
      entityId: knowledgeId,
      previousValue: mapAuditKnowledge(existing),
      context: audit,
    });
  },
};
