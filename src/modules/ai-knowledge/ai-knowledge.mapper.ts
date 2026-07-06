import type {
  AiKnowledge,
  AiKnowledgeTranslation,
  Spot,
  SpotTranslation,
} from "@/generated/prisma/client";
import { DEFAULT_LANGUAGE, type AppLanguage } from "@/lib/i18n/languages";
import type {
  AiKnowledgeDto,
  AiKnowledgeSpotSummary,
  AiKnowledgeTranslationDto,
} from "./ai-knowledge.types";

type SpotWithTranslations = Spot & { translations: SpotTranslation[] };

type AiKnowledgeWithRelations = AiKnowledge & {
  translations: AiKnowledgeTranslation[];
  spot: SpotWithTranslations | null;
};

function mapSpotSummary(
  spot: SpotWithTranslations | null,
): AiKnowledgeSpotSummary | null {
  if (!spot) {
    return null;
  }

  const preferred =
    spot.translations.find((entry) => entry.language === DEFAULT_LANGUAGE) ??
    spot.translations[0];

  return {
    id: spot.id,
    sortOrder: spot.sortOrder,
    title: preferred?.title ?? `Spot ${spot.sortOrder}`,
  };
}

function mapTranslation(
  entry: AiKnowledgeTranslation,
): AiKnowledgeTranslationDto {
  return {
    language: entry.language as AppLanguage,
    audience: entry.audience as AiKnowledgeTranslationDto["audience"],
    title: entry.title,
    content: entry.content,
    keywords: entry.keywords,
  };
}

export function toAiKnowledgeDto(
  knowledge: AiKnowledgeWithRelations,
): AiKnowledgeDto {
  return {
    id: knowledge.id,
    tourId: knowledge.tourId,
    spotId: knowledge.spotId,
    spot: mapSpotSummary(knowledge.spot),
    sortOrder: knowledge.sortOrder,
    translations: knowledge.translations.map(mapTranslation),
    createdAt: knowledge.createdAt.toISOString(),
    updatedAt: knowledge.updatedAt.toISOString(),
  };
}

export function toAiKnowledgeDtoList(records: AiKnowledgeWithRelations[]) {
  return records.map(toAiKnowledgeDto);
}
