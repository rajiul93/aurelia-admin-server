import { z } from "zod";
import { APP_LANGUAGES } from "@/lib/i18n/languages";

const featureLifecycleSchema = z.enum([
  "PLANNED",
  "BETA",
  "ACTIVE",
  "DEPRECATED",
  "HIDDEN",
  "REMOVED",
]);

const keySchema = z
  .string()
  .trim()
  .min(1, "Key is required")
  .max(120)
  .regex(
    /^[a-z][a-z0-9_.-]*$/,
    "Key must be lowercase and use letters, numbers, dots, underscores, or hyphens",
  );

const translationInputSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, "Value is required")
    .max(2000, "Value must be 2000 characters or less"),
});

const translationsSchema = z.object({
  en: translationInputSchema,
  es: translationInputSchema,
  fr: translationInputSchema,
});

function normalizeTranslations(
  translations: z.infer<typeof translationsSchema>,
) {
  return APP_LANGUAGES.map((language) => ({
    language,
    value: translations[language].value,
  }));
}

export const createAppUiStringSchema = z
  .object({
    key: keySchema,
    lifecycle: featureLifecycleSchema.default("ACTIVE"),
    translations: translationsSchema,
  })
  .transform((value) => ({
    key: value.key,
    lifecycle: value.lifecycle,
    translations: normalizeTranslations(value.translations),
  }));

export const updateAppUiStringSchema = z
  .object({
    key: keySchema.optional(),
    lifecycle: featureLifecycleSchema.optional(),
    translations: translationsSchema.optional(),
  })
  .refine(
    (value) =>
      value.key !== undefined ||
      value.lifecycle !== undefined ||
      value.translations !== undefined,
    { message: "At least one field is required" },
  )
  .transform((value) => ({
    key: value.key,
    lifecycle: value.lifecycle,
    translations: value.translations
      ? normalizeTranslations(value.translations)
      : undefined,
  }));

export const listAppUiStringsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  lifecycle: featureLifecycleSchema.optional(),
});

export const appUiStringIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export type CreateAppUiStringInput = z.output<typeof createAppUiStringSchema>;
export type UpdateAppUiStringInput = z.output<typeof updateAppUiStringSchema>;
export type ListAppUiStringsQuery = z.output<typeof listAppUiStringsQuerySchema>;
