import { z } from "zod";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { slugify } from "@/lib/slug";
import { TOUR_LIFECYCLE_ACTIONS } from "./tour.publish";

const publishStatusSchema = z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);

const tourTranslationInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5000 characters or less"),
  slug: z.string().trim().max(120, "Slug must be 120 characters or less"),
});

const audienceLanguageTranslationsSchema = z.object(
  AUDIENCE_TYPES.reduce(
    (accumulator, audience) => {
      accumulator[audience] = z.object({
        en: tourTranslationInputSchema,
        es: tourTranslationInputSchema,
        fr: tourTranslationInputSchema,
      });
      return accumulator;
    },
    {} as Record<
      (typeof AUDIENCE_TYPES)[number],
      z.ZodObject<{
        en: typeof tourTranslationInputSchema;
        es: typeof tourTranslationInputSchema;
        fr: typeof tourTranslationInputSchema;
      }>
    >,
  ),
);

function normalizeTranslations(
  translations: z.infer<typeof audienceLanguageTranslationsSchema>,
) {
  return AUDIENCE_TYPES.flatMap((audience) =>
    APP_LANGUAGES.map((language) => {
      const entry = translations[audience][language];
      const slug = slugify(entry.slug) || slugify(entry.title);

      return {
        audience,
        language,
        title: entry.title,
        description: entry.description,
        slug,
      };
    }),
  );
}

function refineTranslationSlugs(
  translations: z.infer<typeof audienceLanguageTranslationsSchema>,
  ctx: z.RefinementCtx,
) {
  for (const audience of AUDIENCE_TYPES) {
    for (const language of APP_LANGUAGES) {
      const entry = translations[audience][language];
      const slug = slugify(entry.slug) || slugify(entry.title);

      if (!slug) {
        ctx.addIssue({
          code: "custom",
          path: ["translations", audience, language, "slug"],
          message: "Slug is required",
        });
      }
    }
  }
}

function resolveBaseSlug(
  translations: ReturnType<typeof normalizeTranslations>,
  slug?: string,
) {
  const normalized = slugify(slug ?? "");
  if (normalized) {
    return normalized;
  }

  const english = translations.find(
    (entry) => entry.language === "en" && entry.audience === "ADULTS",
  );
  return english?.slug ?? translations[0]?.slug ?? "";
}

export const createTourSchema = z
  .object({
    slug: z.string().trim().max(120, "Slug must be 120 characters or less").optional(),
    placeId: z.string().trim().min(1).nullable().optional(),
    coverMediaId: z.string().trim().min(1, "Cover image is required"),
    translations: audienceLanguageTranslationsSchema,
  })
  .superRefine((value, ctx) => {
    refineTranslationSlugs(value.translations, ctx);

    const translations = normalizeTranslations(value.translations);
    const baseSlug = resolveBaseSlug(translations, value.slug);

    if (!baseSlug) {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Tour slug is required",
      });
    }
  })
  .transform((value) => {
    const translations = normalizeTranslations(value.translations);
    const baseSlug = resolveBaseSlug(translations, value.slug);

    return {
      slug: baseSlug,
      placeId: value.placeId ?? null,
      coverMediaId: value.coverMediaId,
      translations,
    };
  });

export const updateTourSchema = z
  .object({
    slug: z.string().trim().max(120, "Slug must be 120 characters or less").optional(),
    placeId: z.string().trim().min(1).nullable().optional(),
    coverMediaId: z.string().trim().min(1).nullable().optional(),
    translations: audienceLanguageTranslationsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.translations) {
      refineTranslationSlugs(value.translations, ctx);
    }
  })
  .transform((value) => ({
    slug: value.slug ? slugify(value.slug) || undefined : undefined,
    placeId: value.placeId,
    coverMediaId: value.coverMediaId,
    translations: value.translations
      ? normalizeTranslations(value.translations)
      : undefined,
  }));

export const tourLifecycleActionSchema = z.object({
  action: z.enum(TOUR_LIFECYCLE_ACTIONS),
});

export const listToursQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  publishStatus: publishStatusSchema.optional(),
  language: z.enum(APP_LANGUAGES).optional(),
});

export const tourIdParamSchema = z.object({
  tourId: z.string().trim().min(1, "Tour id is required"),
});

export type CreateTourInput = z.output<typeof createTourSchema>;
export type UpdateTourInput = z.output<typeof updateTourSchema>;
export type ListToursQuery = z.infer<typeof listToursQuerySchema>;
