import type { AppLanguage } from "@/lib/i18n/languages";
import type { MediaDto } from "@/modules/media/media.types";

export type FaqCategoryTranslationDto = {
  language: AppLanguage;
  title: string;
  slug: string;
};

export type FaqCategoryDto = {
  id: string;
  imageMediaId: string | null;
  imageMedia: MediaDto | null;
  translations: FaqCategoryTranslationDto[];
  /** Present when a specific language is requested. */
  language?: AppLanguage;
  title?: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
};
