import { z } from "zod";
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

const publishStatusFormSchema = z.enum([
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
]);

export const tourFormSchema = z.object({
  cover: mediaFieldValueSchema,
  slug: z.string(),
  publishStatus: publishStatusFormSchema,
  translations: z.object({
    en: tourTranslationFormSchema,
    es: tourTranslationFormSchema,
    fr: tourTranslationFormSchema,
  }),
});

export type TourFormInput = z.infer<typeof tourFormSchema>;
