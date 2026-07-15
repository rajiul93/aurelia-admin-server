import { z } from "zod";

const translationSchema = z.object({
  bio: z.string().trim().max(1000).default(""),
});

const translationsSchema = z.object({
  en: translationSchema,
  es: translationSchema,
  fr: translationSchema,
});

export const createHostSchema = z.object({
  name: z.string().trim().min(1, "Host name is required").max(200),
  role: z.string().trim().max(200).optional().nullable(),
  photoMediaId: z.string().trim().min(1).optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  availableFrom: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format")
    .optional()
    .nullable(),
  availableTo: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format")
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
  translations: translationsSchema,
});

export const updateHostSchema = createHostSchema.partial();

export const tourIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
});

export const hostIdParamSchema = z.object({
  hostId: z.string().trim().min(1),
});

export type CreateHostInput = z.infer<typeof createHostSchema>;
export type UpdateHostInput = z.infer<typeof updateHostSchema>;
