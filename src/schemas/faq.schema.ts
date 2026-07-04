import { z } from "zod";
import { isEmptyQuillHtml } from "@/modules/faq/faq.answer";

const faqTranslationFormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question is required")
    .max(500, "Question must be 500 characters or less"),
  answer_html: z.string().refine((value) => !isEmptyQuillHtml(value), {
    message: "Answer is required",
  }),
  answer_text: z.string(),
});

export const faqFormSchema = z.object({
  categoryId: z.string().trim().min(1, "Category is required"),
  translations: z.object({
    en: faqTranslationFormSchema,
    es: faqTranslationFormSchema,
    fr: faqTranslationFormSchema,
  }),
});

export type FaqFormInput = z.infer<typeof faqFormSchema>;
