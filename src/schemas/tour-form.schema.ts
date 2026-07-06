import { z } from "zod";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { mediaFieldValueSchema } from "@/schemas/media.schema";

const tourTranslationFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be 5000 characters or less"),
  slug: z.string(),
});

export const tourFormSchema = z.object({
  cover: mediaFieldValueSchema,
  slug: z.string(),
  translations: z.object(
    AUDIENCE_TYPES.reduce(
      (accumulator, audience) => {
        accumulator[audience] = z.object({
          en: tourTranslationFormSchema,
          es: tourTranslationFormSchema,
          fr: tourTranslationFormSchema,
        });
        return accumulator;
      },
      {} as Record<
        (typeof AUDIENCE_TYPES)[number],
        z.ZodObject<{
          en: typeof tourTranslationFormSchema;
          es: typeof tourTranslationFormSchema;
          fr: typeof tourTranslationFormSchema;
        }>
      >,
    ),
  ),
});

export type TourFormInput = z.infer<typeof tourFormSchema>;
