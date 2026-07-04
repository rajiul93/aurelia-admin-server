import { z } from "zod";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { buildFaqAnswer, isEmptyQuillHtml } from "./faq.answer";

const answerHtmlSchema = z
  .string()
  .refine((value) => !isEmptyQuillHtml(value), {
    message: "Answer is required",
  });

const faqTranslationInputSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question is required")
    .max(500, "Question must be 500 characters or less"),
  answer_html: answerHtmlSchema,
  answer_text: z.string().optional(),
});

const translationsSchema = z.object({
  en: faqTranslationInputSchema,
  es: faqTranslationInputSchema,
  fr: faqTranslationInputSchema,
});

function normalizeTranslations(
  translations: z.infer<typeof translationsSchema>,
) {
  return APP_LANGUAGES.map((language) => {
    const entry = translations[language];
    const answer = buildFaqAnswer(entry.answer_html);

    return {
      language,
      question: entry.question,
      answer_html: answer.answer_html,
      answer_text: answer.answer_text,
    };
  });
}

export const createFaqSchema = z
  .object({
    categoryId: z.string().trim().min(1, "Category is required"),
    translations: translationsSchema,
  })
  .transform((value) => ({
    categoryId: value.categoryId,
    translations: normalizeTranslations(value.translations),
  }));

export const updateFaqSchema = z
  .object({
    categoryId: z.string().trim().min(1, "Category is required").optional(),
    translations: translationsSchema.optional(),
  })
  .transform((value) => ({
    categoryId: value.categoryId,
    translations: value.translations
      ? normalizeTranslations(value.translations)
      : undefined,
  }));

export const listFaqsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  language: z.enum(APP_LANGUAGES).optional(),
});

export const faqIdParamSchema = z.object({
  id: z.string().trim().min(1, "FAQ id is required"),
});

export type CreateFaqInput = z.output<typeof createFaqSchema>;
export type UpdateFaqInput = z.output<typeof updateFaqSchema>;
export type ListFaqsQuery = z.infer<typeof listFaqsQuerySchema>;
