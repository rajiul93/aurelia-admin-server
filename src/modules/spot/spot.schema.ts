import { z } from "zod";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { buildFaqAnswer, isEmptyQuillHtml } from "@/modules/faq/faq.answer";
import {
  buildQuillJson,
  isEmptyQuillContent,
} from "@/modules/tour/tour.quill";

const spotTranslationInputSchema = z.object({
  title: z.string().trim().min(1, "Spot title is required").max(200),
  shortDesc: z.string().trim().max(500).optional(),
  quill_html: z.string().refine((value) => !isEmptyQuillContent(value), {
    message: "Spot content is required",
  }),
});

const audienceLanguageTranslationsSchema = z.object(
  AUDIENCE_TYPES.reduce(
    (accumulator, audience) => {
      accumulator[audience] = z.object({
        en: spotTranslationInputSchema,
        es: spotTranslationInputSchema,
        fr: spotTranslationInputSchema,
      });
      return accumulator;
    },
    {} as Record<
      (typeof AUDIENCE_TYPES)[number],
      z.ZodObject<{
        en: typeof spotTranslationInputSchema;
        es: typeof spotTranslationInputSchema;
        fr: typeof spotTranslationInputSchema;
      }>
    >,
  ),
);

export function normalizeSpotTranslations(
  translations: z.infer<typeof audienceLanguageTranslationsSchema>,
) {
  return AUDIENCE_TYPES.flatMap((audience) =>
    APP_LANGUAGES.map((language) => {
      const entry = translations[audience][language];
      const quill = buildQuillJson(entry.quill_html);

      return {
        audience,
        language,
        title: entry.title,
        shortDesc: entry.shortDesc?.trim() ?? "",
        quillJson: quill,
        descriptionHtml: quill.html,
        descriptionText: quill.text,
      };
    }),
  );
}

export const createSpotSchema = z
  .object({
    sortOrder: z.number().int().min(0),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    floor: z.number().int().min(0).optional(),
    includedInQuickTour: z.boolean().optional(),
    translations: audienceLanguageTranslationsSchema,
  })
  .transform((value) => ({
    sortOrder: value.sortOrder,
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
    floor: value.floor ?? 0,
    includedInQuickTour: value.includedInQuickTour ?? true,
    translations: normalizeSpotTranslations(value.translations),
  }));

export const updateSpotSchema = z
  .object({
    sortOrder: z.number().int().min(0).optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    floor: z.number().int().min(0).optional(),
    includedInQuickTour: z.boolean().optional(),
    translations: audienceLanguageTranslationsSchema.optional(),
  })
  .transform((value) => ({
    sortOrder: value.sortOrder,
    latitude: value.latitude,
    longitude: value.longitude,
    floor: value.floor,
    includedInQuickTour: value.includedInQuickTour,
    translations: value.translations
      ? normalizeSpotTranslations(value.translations)
      : undefined,
  }));

export const createSpotMediaSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "AUDIO"]),
  mediaId: z.string().trim().min(1, "Media is required"),
  thumbnailMediaId: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  language: z.enum(APP_LANGUAGES),
  audience: z.enum(AUDIENCE_TYPES).default("ADULTS"),
  includedInQuickTour: z.boolean().default(true),
});

export const updateSpotMediaSchema = createSpotMediaSchema.partial();

const spotFaqTranslationInputSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
  answer_html: z.string().refine((value) => !isEmptyQuillHtml(value), {
    message: "Answer is required",
  }),
});

const spotFaqAudienceLanguageTranslationsSchema = z.object(
  AUDIENCE_TYPES.reduce(
    (accumulator, audience) => {
      accumulator[audience] = z.object({
        en: spotFaqTranslationInputSchema,
        es: spotFaqTranslationInputSchema,
        fr: spotFaqTranslationInputSchema,
      });
      return accumulator;
    },
    {} as Record<
      (typeof AUDIENCE_TYPES)[number],
      z.ZodObject<{
        en: typeof spotFaqTranslationInputSchema;
        es: typeof spotFaqTranslationInputSchema;
        fr: typeof spotFaqTranslationInputSchema;
      }>
    >,
  ),
);

function normalizeSpotFaqTranslations(
  translations: z.infer<typeof spotFaqAudienceLanguageTranslationsSchema>,
) {
  return AUDIENCE_TYPES.flatMap((audience) =>
    APP_LANGUAGES.map((language) => {
      const entry = translations[audience][language];
      const answer = buildFaqAnswer(entry.answer_html);

      return {
        audience,
        language,
        question: entry.question,
        answerHtml: answer.answer_html,
        answerText: answer.answer_text,
        answerJson: {
          html: answer.answer_html,
          text: answer.answer_text,
        },
      };
    }),
  );
}

export const createSpotFaqSchema = z
  .object({
    sortOrder: z.number().int().min(0).default(0),
    translations: spotFaqAudienceLanguageTranslationsSchema,
  })
  .transform((value) => ({
    sortOrder: value.sortOrder,
    translations: normalizeSpotFaqTranslations(value.translations),
  }));

export const updateSpotFaqSchema = z
  .object({
    sortOrder: z.number().int().min(0).optional(),
    translations: spotFaqAudienceLanguageTranslationsSchema.optional(),
  })
  .transform((value) => ({
    sortOrder: value.sortOrder,
    translations: value.translations
      ? normalizeSpotFaqTranslations(value.translations)
      : undefined,
  }));

export const tourIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
});

export const spotIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
  spotId: z.string().trim().min(1),
});

export const spotMediaIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
  spotId: z.string().trim().min(1),
  mediaId: z.string().trim().min(1),
});

export const spotFaqIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
  spotId: z.string().trim().min(1),
  faqId: z.string().trim().min(1),
});

export type CreateSpotInput = z.output<typeof createSpotSchema>;
export type UpdateSpotInput = z.output<typeof updateSpotSchema>;
export type CreateSpotMediaInput = z.output<typeof createSpotMediaSchema>;
export type UpdateSpotMediaInput = z.output<typeof updateSpotMediaSchema>;
export type CreateSpotFaqInput = z.output<typeof createSpotFaqSchema>;
export type UpdateSpotFaqInput = z.output<typeof updateSpotFaqSchema>;
