import type { AppLanguage } from "@/lib/i18n/languages";

export type FaqTranslationDto = {
  language: AppLanguage;
  question: string;
  answer_text: string;
  answer_html: string;
};

export type FaqCategorySummaryDto = {
  id: string;
  title: string;
  slug: string;
  translations?: FaqCategoryTranslationSummaryDto[];
};

export type FaqCategoryTranslationSummaryDto = {
  language: AppLanguage;
  title: string;
  slug: string;
};

export type FaqDto = {
  id: string;
  categoryId: string;
  category: FaqCategorySummaryDto;
  translations: FaqTranslationDto[];
  /** Present when a specific language is requested. */
  language?: AppLanguage;
  question?: string;
  answer_text?: string;
  answer_html?: string;
  createdAt: string;
  updatedAt: string;
};

/** @deprecated Prefer FaqDto */
export type TFaq = FaqDto;
