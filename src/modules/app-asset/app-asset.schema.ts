import { z } from "zod";

const featureLifecycleSchema = z.enum([
  "PLANNED",
  "BETA",
  "ACTIVE",
  "DEPRECATED",
  "HIDDEN",
  "REMOVED",
]);

const timeOfDaySchema = z.enum(["MORNING", "AFTERNOON", "EVENING"]);

const keySchema = z
  .string()
  .trim()
  .min(1, "Key is required")
  .max(120)
  .regex(
    /^[a-z][a-z0-9_.-]*$/,
    "Key must be lowercase and use letters, numbers, dots, underscores, or hyphens",
  );

export const createAppAssetSchema = z.object({
  key: keySchema,
  mediaId: z.string().trim().min(1, "Media is required"),
  timeOfDay: timeOfDaySchema.nullable().optional(),
  lifecycle: featureLifecycleSchema.default("ACTIVE"),
});

export const updateAppAssetSchema = z
  .object({
    key: keySchema.optional(),
    mediaId: z.string().trim().min(1).optional(),
    timeOfDay: timeOfDaySchema.nullable().optional(),
    lifecycle: featureLifecycleSchema.optional(),
  })
  .refine(
    (value) =>
      value.key !== undefined ||
      value.mediaId !== undefined ||
      value.timeOfDay !== undefined ||
      value.lifecycle !== undefined,
    { message: "At least one field is required" },
  );

export const listAppAssetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  timeOfDay: timeOfDaySchema.optional(),
  lifecycle: featureLifecycleSchema.optional(),
});

export const appAssetIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export type CreateAppAssetInput = z.output<typeof createAppAssetSchema>;
export type UpdateAppAssetInput = z.output<typeof updateAppAssetSchema>;
export type ListAppAssetsQuery = z.output<typeof listAppAssetsQuerySchema>;
