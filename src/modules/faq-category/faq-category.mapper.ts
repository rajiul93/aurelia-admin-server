import type {
  FaqCategory,
  FaqCategoryTranslation,
  Media,
} from "@/generated/prisma/client";
import type { AppLanguage } from "@/lib/i18n/languages";
import { toMediaDto } from "@/modules/media/media.mapper";
import type { FaqCategoryDto } from "./faq-category.types";

type FaqCategoryWithRelations = FaqCategory & {
  imageMedia: Media | null;
  translations: FaqCategoryTranslation[];
};

export function toFaqCategoryDto(
  category: FaqCategoryWithRelations,
  language?: AppLanguage,
): FaqCategoryDto {
  const translations = category.translations.map((entry) => ({
    language: entry.language as AppLanguage,
    title: entry.title,
    slug: entry.slug,
  }));

  const localized = language
    ? translations.find((entry) => entry.language === language)
    : undefined;

  return {
    id: category.id,
    imageMediaId: category.imageMediaId,
    imageMedia: category.imageMedia ? toMediaDto(category.imageMedia) : null,
    translations,
    ...(localized
      ? {
          language,
          title: localized.title,
          slug: localized.slug,
        }
      : {}),
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toFaqCategoryDtoList(
  categories: FaqCategoryWithRelations[],
  language?: AppLanguage,
): FaqCategoryDto[] {
  return categories.map((category) => toFaqCategoryDto(category, language));
}
