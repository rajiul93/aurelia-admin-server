import { z } from "zod";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import {
  buildQuillJson,
  isEmptyQuillContent,
} from "@/modules/tour/tour.quill";
import { buildFaqAnswer, isEmptyQuillHtml } from "@/modules/faq/faq.answer";

const spotTranslationInputSchema = z.object({
  title: z.string().trim().min(1, "Spot title is required").max(200),
  shortDesc: z.string().trim().max(500).optional(),
  quill_html: z.string().refine((value) => !isEmptyQuillContent(value), {
    message: "Spot content is required",
  }),
});

const spotTranslationsSchema = z.object({
  en: spotTranslationInputSchema,
  es: spotTranslationInputSchema,
  fr: spotTranslationInputSchema,
});

const spotMediaInputSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "AUDIO"]),
  mediaId: z.string().trim().min(1, "Media is required"),
  thumbnailMediaId: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

const spotFaqTranslationInputSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(500),
  answer_html: z.string().refine((value) => !isEmptyQuillHtml(value), {
    message: "Answer is required",
  }),
});

const spotFaqTranslationsSchema = z.object({
  en: spotFaqTranslationInputSchema,
  es: spotFaqTranslationInputSchema,
  fr: spotFaqTranslationInputSchema,
});

const spotFaqInputSchema = z.object({
  sortOrder: z.number().int().min(0).default(0),
  translations: spotFaqTranslationsSchema,
});

export const spotInputSchema = z.object({
  sortOrder: z.number().int().min(0),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  floor: z.number().int().min(0).default(0).optional(),
  translations: spotTranslationsSchema,
  medias: z.array(spotMediaInputSchema).default([]),
  faqs: z.array(spotFaqInputSchema).default([]),
});

function normalizeSpotTranslations(
  translations: z.infer<typeof spotTranslationsSchema>,
) {
  return APP_LANGUAGES.map((language) => {
    const entry = translations[language];
    const quill = buildQuillJson(entry.quill_html);

    return {
      language,
      title: entry.title,
      shortDesc: entry.shortDesc?.trim() ?? "",
      quillJson: quill,
      descriptionHtml: quill.html,
      descriptionText: quill.text,
    };
  });
}

function normalizeSpotFaqTranslations(
  translations: z.infer<typeof spotFaqTranslationsSchema>,
) {
  return APP_LANGUAGES.map((language) => {
    const entry = translations[language];
    const answer = buildFaqAnswer(entry.answer_html);

    return {
      language,
      question: entry.question,
      answerHtml: answer.answer_html,
      answerText: answer.answer_text,
      answerJson: {
        html: answer.answer_html,
        text: answer.answer_text,
      },
    };
  });
}

export function normalizeSpotInput(spot: z.infer<typeof spotInputSchema>) {
  return {
    sortOrder: spot.sortOrder,
    latitude: spot.latitude ?? null,
    longitude: spot.longitude ?? null,
    floor: spot.floor ?? 0,
    translations: normalizeSpotTranslations(spot.translations),
    medias: spot.medias.map((media) => ({
      type: media.type,
      mediaId: media.mediaId,
      thumbnailMediaId: media.thumbnailMediaId ?? null,
      sortOrder: media.sortOrder,
    })),
    faqs: spot.faqs.map((faq) => ({
      sortOrder: faq.sortOrder,
      translations: normalizeSpotFaqTranslations(faq.translations),
    })),
  };
}

export type SpotInput = z.infer<typeof spotInputSchema>;
export type NormalizedSpotInput = ReturnType<typeof normalizeSpotInput>;
