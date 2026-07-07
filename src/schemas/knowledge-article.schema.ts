import { z } from "zod";
import { isEmptyQuillHtml } from "@/modules/faq/faq.answer";

const translationFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  bodyHtml: z.string().refine((value) => !isEmptyQuillHtml(value), {
    message: "Content is required",
  }),
  bodyText: z.string(),
});

export const knowledgeArticleFormSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Key must be lowercase kebab-case (e.g. privacy-policy)",
    ),
  category: z.enum(["KNOWLEDGE", "INFO_PAGE", "LEGAL"]),
  includeInAssistant: z.boolean(),
  sortOrder: z.number().int().min(0),
  icon: z.string().trim().max(60),
  translations: z.object({
    en: translationFormSchema,
    es: translationFormSchema,
    fr: translationFormSchema,
  }),
});

export type KnowledgeArticleFormInput = z.infer<
  typeof knowledgeArticleFormSchema
>;
