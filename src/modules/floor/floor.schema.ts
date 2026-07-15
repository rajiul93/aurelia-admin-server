import { z } from "zod";
import { AUDIENCE_TYPES } from "@/lib/i18n/audiences";
import { APP_LANGUAGES } from "@/lib/i18n/languages";

export const TRANSITION_TYPES = [
  "STAIRS",
  "ELEVATOR",
  "LIFT",
  "RAMP",
  "ESCALATOR",
] as const;

const translationInputSchema = z.object({
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
        en: translationInputSchema,
        es: translationInputSchema,
        fr: translationInputSchema,
      });
      return accumulator;
    },
    {} as Record<
      (typeof AUDIENCE_TYPES)[number],
      z.ZodObject<{
        en: typeof translationInputSchema;
        es: typeof translationInputSchema;
        fr: typeof translationInputSchema;
      }>
    >,
  ),
);

export function normalizeFloorTranslations(
  translations: z.infer<typeof audienceLanguageTranslationsSchema>,
) {
  return AUDIENCE_TYPES.flatMap((audience) =>
    APP_LANGUAGES.map((language) => ({
      audience,
      language,
      name: translations[audience][language].name,
    })),
  );
}

export const createFloorSchema = z
  .object({
    floorNo: z.coerce.number().int(),
    mapTileUrl: z.string().trim().url().nullable().optional(),
    coverMediaId: z.string().trim().min(1).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).default(0),
    translations: audienceLanguageTranslationsSchema.optional(),
  })
  .transform((value) => ({
    floorNo: value.floorNo,
    mapTileUrl: value.mapTileUrl ?? null,
    coverMediaId: value.coverMediaId ?? null,
    sortOrder: value.sortOrder,
    translations: value.translations
      ? normalizeFloorTranslations(value.translations)
      : undefined,
  }));

export const updateFloorSchema = z
  .object({
    floorNo: z.coerce.number().int().optional(),
    mapTileUrl: z.string().trim().url().nullable().optional(),
    coverMediaId: z.string().trim().min(1).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    translations: audienceLanguageTranslationsSchema.optional(),
  })
  .refine(
    (value) =>
      value.floorNo !== undefined ||
      value.mapTileUrl !== undefined ||
      value.coverMediaId !== undefined ||
      value.sortOrder !== undefined ||
      value.translations !== undefined,
    { message: "At least one field is required" },
  )
  .transform((value) => ({
    floorNo: value.floorNo,
    mapTileUrl: value.mapTileUrl,
    coverMediaId: value.coverMediaId,
    sortOrder: value.sortOrder,
    translations: value.translations
      ? normalizeFloorTranslations(value.translations)
      : undefined,
  }));

export const createTransitionPointSchema = z.object({
  type: z.enum(TRANSITION_TYPES),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  connectsToFloorId: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateTransitionPointSchema = z
  .object({
    type: z.enum(TRANSITION_TYPES).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    connectsToFloorId: z.string().trim().min(1).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one field is required",
  });

export const tourIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
});

export const floorIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
  floorId: z.string().trim().min(1),
});

export const transitionPointIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
  floorId: z.string().trim().min(1),
  pointId: z.string().trim().min(1),
});

export type CreateFloorInput = z.output<typeof createFloorSchema>;
export type UpdateFloorInput = z.output<typeof updateFloorSchema>;
export type CreateTransitionPointInput = z.output<
  typeof createTransitionPointSchema
>;
export type UpdateTransitionPointInput = z.output<
  typeof updateTransitionPointSchema
>;
