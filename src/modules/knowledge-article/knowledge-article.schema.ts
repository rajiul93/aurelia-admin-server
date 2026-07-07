import { z } from "zod";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { buildFaqAnswer, isEmptyQuillHtml } from "@/modules/faq";

const KNOWLEDGE_CATEGORIES = ["KNOWLEDGE", "INFO_PAGE", "LEGAL"] as const;

const bodyHtmlSchema = z.string().refine((value) => !isEmptyQuillHtml(value), {
  message: "Content is required",
});

const translationInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  bodyHtml: bodyHtmlSchema,
  bodyText: z.string().optional(),
});

const translationsSchema = z.object({
  en: translationInputSchema,
  es: translationInputSchema,
  fr: translationInputSchema,
});

function normalizeTranslations(
  translations: z.infer<typeof translationsSchema>,
) {
  return APP_LANGUAGES.map((language) => {
    const entry = translations[language];
    const answer = buildFaqAnswer(entry.bodyHtml);

    return {
      language,
      title: entry.title,
      bodyHtml: answer.answer_html,
      bodyText: answer.answer_text,
    };
  });
}

const keySchema = z
  .string()
  .trim()
  .min(1, "Key is required")
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Key must be lowercase kebab-case (e.g. privacy-policy)",
  );

export const createKnowledgeArticleSchema = z
  .object({
    key: keySchema,
    category: z.enum(KNOWLEDGE_CATEGORIES),
    includeInAssistant: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).default(0),
    icon: z.string().trim().max(60).optional(),
    translations: translationsSchema,
  })
  .transform((value) => ({
    key: value.key,
    category: value.category,
    includeInAssistant: value.includeInAssistant,
    sortOrder: value.sortOrder,
    icon: value.icon,
    translations: normalizeTranslations(value.translations),
  }));

export const updateKnowledgeArticleSchema = z
  .object({
    key: keySchema.optional(),
    category: z.enum(KNOWLEDGE_CATEGORIES).optional(),
    includeInAssistant: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    icon: z.string().trim().max(60).nullable().optional(),
    translations: translationsSchema.optional(),
  })
  .transform((value) => ({
    key: value.key,
    category: value.category,
    includeInAssistant: value.includeInAssistant,
    sortOrder: value.sortOrder,
    icon: value.icon,
    translations: value.translations
      ? normalizeTranslations(value.translations)
      : undefined,
  }));

export const listKnowledgeArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  category: z.enum(KNOWLEDGE_CATEGORIES).optional(),
  language: z.enum(APP_LANGUAGES).optional(),
});

export const knowledgeArticleIdParamSchema = z.object({
  id: z.string().trim().min(1, "Knowledge article id is required"),
});

export type CreateKnowledgeArticleInput = z.output<
  typeof createKnowledgeArticleSchema
>;
export type UpdateKnowledgeArticleInput = z.output<
  typeof updateKnowledgeArticleSchema
>;
export type ListKnowledgeArticlesQuery = z.infer<
  typeof listKnowledgeArticlesQuerySchema
>;
