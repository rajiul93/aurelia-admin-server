import type { AppLanguage } from "@/lib/i18n/languages";
import type { AudienceType } from "@/lib/i18n/audiences";

export type AiKnowledgeTranslationDto = {
  language: AppLanguage;
  audience: AudienceType;
  title: string;
  content: string;
  keywords: string;
};

export type AiKnowledgeSpotSummary = {
  id: string;
  sortOrder: number;
  title: string;
};

export type AiKnowledgeDto = {
  id: string;
  tourId: string;
  spotId: string | null;
  spot: AiKnowledgeSpotSummary | null;
  sortOrder: number;
  translations: AiKnowledgeTranslationDto[];
  createdAt: string;
  updatedAt: string;
};
