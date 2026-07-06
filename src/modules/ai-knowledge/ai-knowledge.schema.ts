import { z } from "zod";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { APP_LANGUAGES } from "@/lib/i18n/languages";

const translationInputSchema = z.object({
  title: z.string().trim().max(200).default(""),
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(10_000, "Content must be 10000 characters or less"),
  keywords: z.string().trim().max(500).default(""),
});

const audienceLanguageTranslationsSchema = z.object(
  AUDIENCE_TYPES.reduce(
    (accumulator, audience) => {
      accumulator[audience] = z.object({
        en: translationInputSchema,
        es: translationInputSchema,
        fr: translationInputSchema,
      });
      return accumulator;
    },
    {} as Record<
      (typeof AUDIENCE_TYPES)[number],
      z.ZodObject<{
        en: typeof translationInputSchema;
        es: typeof translationInputSchema;
        fr: typeof translationInputSchema;
      }>
    >,
  ),
);

export function normalizeAiKnowledgeTranslations(
  translations: z.infer<typeof audienceLanguageTranslationsSchema>,
) {
  return AUDIENCE_TYPES.flatMap((audience) =>
    APP_LANGUAGES.map((language) => ({
      audience,
      language,
      title: translations[audience][language].title,
      content: translations[audience][language].content,
      keywords: translations[audience][language].keywords,
    })),
  );
}

export const createAiKnowledgeSchema = z
  .object({
    spotId: z.string().trim().min(1).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    translations: audienceLanguageTranslationsSchema,
  })
  .transform((value) => ({
    spotId: value.spotId ?? null,
    sortOrder: value.sortOrder,
    translations: normalizeAiKnowledgeTranslations(value.translations),
  }));

export const updateAiKnowledgeSchema = z
  .object({
    spotId: z.string().trim().min(1).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    translations: audienceLanguageTranslationsSchema.optional(),
  })
  .refine(
    (value) =>
      value.spotId !== undefined ||
      value.sortOrder !== undefined ||
      value.translations !== undefined,
    { message: "At least one field is required" },
  )
  .transform((value) => ({
    spotId: value.spotId,
    sortOrder: value.sortOrder,
    translations: value.translations
      ? normalizeAiKnowledgeTranslations(value.translations)
      : undefined,
  }));

export const tourIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
});

export const knowledgeIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
  knowledgeId: z.string().trim().min(1),
});

export type CreateAiKnowledgeInput = z.output<typeof createAiKnowledgeSchema>;
export type UpdateAiKnowledgeInput = z.output<typeof updateAiKnowledgeSchema>;
