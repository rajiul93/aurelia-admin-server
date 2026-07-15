import { z } from "zod";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { isEmptyQuillHtml } from "@/modules/faq/faq.answer";
import { isEmptyQuillContent } from "@/modules/tour/tour.quill";
import { mediaFieldValueSchema } from "@/schemas/media.schema";

const sortOrderSchema = z.number().int().min(0, "Order must be 0 or greater");

const spotTranslationFormSchema = z.object({
  title: z.string().trim().min(1, "Spot title is required").max(200),
  shortDesc: z.string().trim().max(500),
  quill_html: z.string().refine((value) => !isEmptyQuillContent(value), {
    message: "Spot content is required",
  }),
  quill_text: z.string(),
});

const audienceLanguageTranslationsSchema = z.object(
  AUDIENCE_TYPES.reduce(
    (accumulator, audience) => {
      accumulator[audience] = z.object({
        en: spotTranslationFormSchema,
        es: spotTranslationFormSchema,
        fr: spotTranslationFormSchema,
      });
      return accumulator;
    },
    {} as Record<
      (typeof AUDIENCE_TYPES)[number],
      z.ZodObject<{
        en: typeof spotTranslationFormSchema;
        es: typeof spotTranslationFormSchema;
        fr: typeof spotTranslationFormSchema;
      }>
    >,
  ),
);

export const spotFormSchema = z.object({
  floorId: z.string().min(1, "Floor is required"),
  sortOrder: sortOrderSchema,
  latitude: z.string(),
  longitude: z.string(),
  includedInQuickTour: z.boolean(),
  translations: audienceLanguageTranslationsSchema,
});

export type SpotFormInput = z.infer<typeof spotFormSchema>;

export const spotMediaFormSchema = z
  .object({
    type: z.enum(["IMAGE", "VIDEO", "AUDIO"]),
    language: z.enum(APP_LANGUAGES),
    audience: z.enum(AUDIENCE_TYPES),
    includedInQuickTour: z.boolean(),
    sortOrder: sortOrderSchema,
    media: mediaFieldValueSchema,
    thumbnail: mediaFieldValueSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.media.file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Media file is required",
        path: ["media", "file"],
      });
    }
  });

export type SpotMediaFormInput = z.infer<typeof spotMediaFormSchema>;

const spotFaqTranslationFormSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
  answer_html: z.string().refine((value) => !isEmptyQuillHtml(value), {
    message: "Answer is required",
  }),
  answer_text: z.string(),
});

const spotFaqAudienceLanguageTranslationsSchema = z.object(
  AUDIENCE_TYPES.reduce(
    (accumulator, audience) => {
      accumulator[audience] = z.object({
        en: spotFaqTranslationFormSchema,
        es: spotFaqTranslationFormSchema,
        fr: spotFaqTranslationFormSchema,
      });
      return accumulator;
    },
    {} as Record<
      (typeof AUDIENCE_TYPES)[number],
      z.ZodObject<{
        en: typeof spotFaqTranslationFormSchema;
        es: typeof spotFaqTranslationFormSchema;
        fr: typeof spotFaqTranslationFormSchema;
      }>
    >,
  ),
);

export const spotFaqFormSchema = z.object({
  sortOrder: sortOrderSchema,
  translations: spotFaqAudienceLanguageTranslationsSchema,
});

export type SpotFaqFormInput = z.infer<typeof spotFaqFormSchema>;

export { APP_LANGUAGES, AUDIENCE_TYPES };
