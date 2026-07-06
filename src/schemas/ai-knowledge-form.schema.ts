import { z } from "zod";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { APP_LANGUAGES } from "@/lib/i18n/languages";

const translationFormSchema = z.object({
  title: z.string().trim().max(200),
  content: z
    .string()
    .trim()
    .min(1, "Content is required")
    .max(10_000, "Content must be 10000 characters or less"),
  keywords: z.string().trim().max(500),
});

const audienceLanguageTranslationsSchema = z.object(
  AUDIENCE_TYPES.reduce(
    (accumulator, audience) => {
      accumulator[audience] = z.object({
        en: translationFormSchema,
        es: translationFormSchema,
        fr: translationFormSchema,
      });
      return accumulator;
    },
    {} as Record<
      (typeof AUDIENCE_TYPES)[number],
      z.ZodObject<{
        en: typeof translationFormSchema;
        es: typeof translationFormSchema;
        fr: typeof translationFormSchema;
      }>
    >,
  ),
);

export const aiKnowledgeFormSchema = z.object({
  spotId: z.string(),
  sortOrder: z.number().int().min(0),
  translations: audienceLanguageTranslationsSchema,
});

export type AiKnowledgeFormInput = z.infer<typeof aiKnowledgeFormSchema>;

export { APP_LANGUAGES, AUDIENCE_TYPES };
