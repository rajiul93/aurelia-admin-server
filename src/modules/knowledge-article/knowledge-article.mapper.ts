import type {
  KnowledgeArticle,
  KnowledgeArticleTranslation,
} from "@/generated/prisma/client";
import type { AppLanguage } from "@/lib/i18n/languages";
import type {
  KnowledgeArticleDto,
  KnowledgeCategoryDto,
} from "./knowledge-article.types";

type ArticleWithRelations = KnowledgeArticle & {
  translations: KnowledgeArticleTranslation[];
};

export function toKnowledgeArticleDto(
  article: ArticleWithRelations,
  language?: AppLanguage,
): KnowledgeArticleDto {
  const translations = article.translations.map((entry) => ({
    language: entry.language as AppLanguage,
    title: entry.title,
    bodyHtml: entry.bodyHtml,
    bodyText: entry.bodyText,
  }));

  const localized = language
    ? translations.find((entry) => entry.language === language)
    : undefined;

  return {
    id: article.id,
    key: article.key,
    category: article.category as KnowledgeCategoryDto,
    includeInAssistant: article.includeInAssistant,
    lifecycle: article.lifecycle,
    sortOrder: article.sortOrder,
    icon: article.icon,
    translations,
    ...(localized
      ? {
          language,
          title: localized.title,
          bodyHtml: localized.bodyHtml,
          bodyText: localized.bodyText,
        }
      : {}),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

export function toKnowledgeArticleDtoList(
  articles: ArticleWithRelations[],
  language?: AppLanguage,
): KnowledgeArticleDto[] {
  return articles.map((article) => toKnowledgeArticleDto(article, language));
}
