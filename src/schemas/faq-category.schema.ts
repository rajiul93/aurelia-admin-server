import { z } from "zod";
import { mediaFieldValueSchema } from "@/schemas/media.schema";

const categoryTranslationFormSchema = z.object({
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

export const faqCategoryFormSchema = z.object({
  image: mediaFieldValueSchema,
  translations: z.object({
    en: categoryTranslationFormSchema,
    es: categoryTranslationFormSchema,
    fr: categoryTranslationFormSchema,
  }),
});

export type FaqCategoryFormInput = z.infer<typeof faqCategoryFormSchema>;
