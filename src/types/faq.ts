import type { AppLanguage } from "@/lib/i18n/languages";
import type { Media } from "@/types/media";

export type FaqTranslation = {
  language: AppLanguage;
  question: string;
  answer_text: string;
  answer_html: string;
};

export type FaqCategoryTranslation = {
  language: AppLanguage;
  title: string;
  slug: string;
};

export type FaqCategorySummary = {
  id: string;
  title: string;
  slug: string;
  translations?: FaqCategoryTranslation[];
};

export type Faq = {
  id: string;
  categoryId: string;
  category: FaqCategorySummary;
  translations: FaqTranslation[];
  language?: AppLanguage;
  question?: string;
  answer_text?: string;
  answer_html?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFaqPayload = {
  categoryId: string;
  translations: Record<
    AppLanguage,
    {
      question: string;
      answer_html: string;
      answer_text?: string;
    }
  >;
};

export type UpdateFaqPayload = Partial<CreateFaqPayload>;

export type FaqCategory = {
  id: string;
  imageMediaId: string | null;
  imageMedia: Media | null;
  translations: FaqCategoryTranslation[];
  language?: AppLanguage;
  title?: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateFaqCategoryPayload = {
  imageMediaId?: string | null;
  translations: Record<
    AppLanguage,
    {
      title: string;
      slug?: string;
    }
  >;
};

export type UpdateFaqCategoryPayload = Partial<CreateFaqCategoryPayload>;
