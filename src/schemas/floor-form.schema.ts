import { z } from "zod";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { APP_LANGUAGES } from "@/lib/i18n/languages";
import { mediaFieldValueSchema } from "@/schemas/media.schema";
import { TRANSITION_TYPE_OPTIONS } from "@/types/floor";

const translationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Floor name is required")
    .max(120, "Floor name must be 120 characters or less"),
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

export const floorFormSchema = z.object({
  floorNo: z.number().int(),
  cover: mediaFieldValueSchema,
  sortOrder: z.number().int().min(0),
  translations: audienceLanguageTranslationsSchema,
});

export type FloorFormInput = z.infer<typeof floorFormSchema>;

export const transitionPointFormSchema = z.object({
  type: z.enum(TRANSITION_TYPE_OPTIONS as [string, ...string[]]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  connectsToFloorId: z.string(),
  sortOrder: z.number().int().min(0),
});

export type TransitionPointFormInput = z.infer<typeof transitionPointFormSchema>;

export { APP_LANGUAGES, AUDIENCE_TYPES };
