import type {
  Faq,
  FaqCategory,
  FaqCategoryTranslation,
  FaqTranslation,
} from "@/generated/prisma/client";
import type { AppLanguage } from "@/lib/i18n/languages";
import type { FaqDto } from "./faq.types";

type FaqWithRelations = Faq & {
  translations: FaqTranslation[];
  category: FaqCategory & {
    translations: FaqCategoryTranslation[];
  };
};

function mapCategorySummary(
  category: FaqCategory & { translations: FaqCategoryTranslation[] },
  language?: AppLanguage,
) {
  const preferred =
    (language
      ? category.translations.find((entry) => entry.language === language)
      : null) ??
    category.translations.find((entry) => entry.language === "en") ??
    category.translations[0];

  return {
    id: category.id,
    title: preferred?.title ?? "",
    slug: preferred?.slug ?? "",
    translations: category.translations.map((entry) => ({
      language: entry.language as AppLanguage,
      title: entry.title,
      slug: entry.slug,
    })),
  };
}

export function toFaqDto(
  faq: FaqWithRelations,
  language?: AppLanguage,
): FaqDto {
  const translations = faq.translations.map((entry) => ({
    language: entry.language as AppLanguage,
    question: entry.question,
    answer_text: entry.answer_text,
    answer_html: entry.answer_html,
  }));

  const localized = language
    ? translations.find((entry) => entry.language === language)
    : undefined;

  return {
    id: faq.id,
    categoryId: faq.categoryId,
    category: mapCategorySummary(faq.category, language),
    translations,
    ...(localized
      ? {
          language,
          question: localized.question,
          answer_text: localized.answer_text,
          answer_html: localized.answer_html,
        }
      : {}),
    createdAt: faq.createdAt.toISOString(),
    updatedAt: faq.updatedAt.toISOString(),
  };
}

export function toFaqDtoList(
  faqs: FaqWithRelations[],
  language?: AppLanguage,
): FaqDto[] {
  return faqs.map((faq) => toFaqDto(faq, language));
}
