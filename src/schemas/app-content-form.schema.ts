import { z } from "zod";
import { mediaFieldValueSchema } from "@/schemas/media.schema";

const keySchema = z
  .string()
  .trim()
  .min(1, "Key is required")
  .max(120)
  .regex(
    /^[a-z][a-z0-9_.-]*$/,
    "Use lowercase letters, numbers, dots, underscores, or hyphens",
  );

const lifecycleSchema = z.enum([
  "PLANNED",
  "BETA",
  "ACTIVE",
  "DEPRECATED",
  "HIDDEN",
  "REMOVED",
]);

const translationFormSchema = z.object({
  value: z.string().trim().min(1, "Value is required").max(2000),
});

export const appUiStringFormSchema = z.object({
  key: keySchema,
  lifecycle: lifecycleSchema,
  translations: z.object({
    en: translationFormSchema,
    es: translationFormSchema,
    fr: translationFormSchema,
  }),
});

export type AppUiStringFormInput = z.infer<typeof appUiStringFormSchema>;

export const appAssetFormSchema = z.object({
  key: keySchema,
  lifecycle: lifecycleSchema,
  timeOfDay: z.enum(["", "MORNING", "AFTERNOON", "EVENING"]),
  media: mediaFieldValueSchema,
});

export type AppAssetFormInput = z.infer<typeof appAssetFormSchema>;

export const lifecycleOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Beta", value: "BETA" },
  { label: "Planned", value: "PLANNED" },
  { label: "Deprecated", value: "DEPRECATED" },
  { label: "Hidden", value: "HIDDEN" },
  { label: "Removed", value: "REMOVED" },
];

export const timeOfDayOptions = [
  { label: "None", value: "" },
  { label: "Morning", value: "MORNING" },
  { label: "Afternoon", value: "AFTERNOON" },
  { label: "Evening", value: "EVENING" },
];
