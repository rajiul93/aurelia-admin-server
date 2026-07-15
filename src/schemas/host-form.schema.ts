import { z } from "zod";
import { mediaFieldValueSchema } from "@/schemas/media.schema";

const bioTranslationSchema = z.object({
  bio: z.string().trim().max(1000),
});

const bioTranslationsSchema = z.object({
  en: bioTranslationSchema,
  es: bioTranslationSchema,
  fr: bioTranslationSchema,
});

export const hostFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  role: z.string().max(200).optional(),
  photo: mediaFieldValueSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  availableFrom: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format HH:mm")
    .nullable()
    .optional(),
  availableTo: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format HH:mm")
    .nullable()
    .optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0),
  translations: bioTranslationsSchema,
});

export type HostFormData = z.infer<typeof hostFormSchema>;
