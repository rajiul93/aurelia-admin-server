import type { AppLanguage } from "@/lib/i18n/languages";

export type KnowledgeCategoryDto = "KNOWLEDGE" | "INFO_PAGE" | "LEGAL";

export type KnowledgeArticleTranslationDto = {
  language: AppLanguage;
  title: string;
  bodyHtml: string;
  bodyText: string;
};

export type KnowledgeArticleDto = {
  id: string;
  key: string;
  category: KnowledgeCategoryDto;
  includeInAssistant: boolean;
  lifecycle: string;
  sortOrder: number;
  icon: string | null;
  translations: KnowledgeArticleTranslationDto[];
  /** Present when a specific language is requested. */
  language?: AppLanguage;
  title?: string;
  bodyHtml?: string;
  bodyText?: string;
  createdAt: string;
  updatedAt: string;
};
