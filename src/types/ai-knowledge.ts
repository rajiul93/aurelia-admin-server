import type { AppLanguage } from "@/lib/i18n/languages";
import type { AudienceType } from "@/lib/i18n/audiences";
import type { AiKnowledgeDto } from "@/modules/ai-knowledge/ai-knowledge.types";

export type AiKnowledge = AiKnowledgeDto;

export type AiKnowledgeTranslationPayload = {
  title: string;
  content: string;
  keywords: string;
};

export type CreateAiKnowledgePayload = {
  spotId?: string | null;
  sortOrder: number;
  translations: Record<
    AudienceType,
    Record<AppLanguage, AiKnowledgeTranslationPayload>
  >;
};

export type UpdateAiKnowledgePayload = Partial<CreateAiKnowledgePayload>;
