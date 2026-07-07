import type { AppLanguage } from "@/lib/i18n/languages";

export type KnowledgeCategory = "KNOWLEDGE" | "INFO_PAGE" | "LEGAL";

export type KnowledgeArticleTranslation = {
  language: AppLanguage;
  title: string;
  bodyHtml: string;
  bodyText: string;
};

export type KnowledgeArticle = {
  id: string;
  key: string;
  category: KnowledgeCategory;
  includeInAssistant: boolean;
  lifecycle: string;
  sortOrder: number;
  icon: string | null;
  translations: KnowledgeArticleTranslation[];
  language?: AppLanguage;
  title?: string;
  bodyHtml?: string;
  bodyText?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateKnowledgeArticlePayload = {
  key: string;
  category: KnowledgeCategory;
  includeInAssistant: boolean;
  sortOrder?: number;
  icon?: string;
  translations: Record<
    AppLanguage,
    {
      title: string;
      bodyHtml: string;
      bodyText?: string;
    }
  >;
};

export type UpdateKnowledgeArticlePayload =
  Partial<CreateKnowledgeArticlePayload>;
