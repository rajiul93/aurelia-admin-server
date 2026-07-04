import { z } from "zod";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { slugify } from "@/lib/slug";

const categoryTranslationInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),
  slug: z
    .string()
    .trim()
    .max(120, "Slug must be 120 characters or less")
    .regex(
      /^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    ),
});

const translationsSchema = z.object({
  en: categoryTranslationInputSchema,
  es: categoryTranslationInputSchema,
  fr: categoryTranslationInputSchema,
});

function normalizeTranslations(
  translations: z.infer<typeof translationsSchema>,
) {
  return APP_LANGUAGES.map((language) => {
    const entry = translations[language];
    const slug = entry.slug.trim() || slugify(entry.title);

    return {
      language,
      title: entry.title,
      slug,
    };
  });
}

function refineTranslationSlugs(
  translations: z.infer<typeof translationsSchema>,
  ctx: z.RefinementCtx,
) {
  for (const language of APP_LANGUAGES) {
    const entry = translations[language];
    const slug = entry.slug.trim() || slugify(entry.title);

    if (!slug) {
      ctx.addIssue({
        code: "custom",
        path: ["translations", language, "slug"],
        message: "Slug is required",
      });
    }
  }
}

export const createFaqCategorySchema = z
  .object({
    imageMediaId: z.string().trim().min(1).nullable().optional(),
    translations: translationsSchema,
  })
  .superRefine((value, ctx) => refineTranslationSlugs(value.translations, ctx))
  .transform((value) => ({
    imageMediaId: value.imageMediaId ?? null,
    translations: normalizeTranslations(value.translations),
  }));

export const updateFaqCategorySchema = z
  .object({
    imageMediaId: z.string().trim().min(1).nullable().optional(),
    translations: translationsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.translations) {
      refineTranslationSlugs(value.translations, ctx);
    }
  })
  .transform((value) => ({
    imageMediaId: value.imageMediaId,
    translations: value.translations
      ? normalizeTranslations(value.translations)
      : undefined,
  }));

export const listFaqCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  language: z.enum(APP_LANGUAGES).optional(),
});

export const faqCategoryIdParamSchema = z.object({
  id: z.string().trim().min(1, "Category id is required"),
});

export type CreateFaqCategoryInput = z.output<typeof createFaqCategorySchema>;
export type UpdateFaqCategoryInput = z.output<typeof updateFaqCategorySchema>;
export type ListFaqCategoriesQuery = z.infer<
  typeof listFaqCategoriesQuerySchema
>;
