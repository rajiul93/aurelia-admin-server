import { z } from "zod";

const tourAccessStatusSchema = z.enum(["ACTIVE", "REVOKED", "EXPIRED"]);

function parseExpiresAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function dateSchema(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => parseExpiresAt(value) !== null, {
      message: `Invalid ${label.toLowerCase()}`,
    })
    .transform((value) => parseExpiresAt(value)!);
}

const expiresAtSchema = dateSchema("Expiration date");
const activatedAtSchema = dateSchema("Activation date");

/** What the admin sends the buyer by hand. Four digits, leading zeros kept. */
const pinSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "PIN must be exactly 4 digits");

const phoneSchema = z
  .string()
  .trim()
  .min(6, "Phone number is required")
  .max(30, "Phone number is too long");

/** Empty string is treated as "no value" so a cleared date/time input passes. */
const visitDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Visit date must be YYYY-MM-DD")
  .or(z.literal(""))
  .nullish();

const startTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be HH:mm")
  .or(z.literal(""))
  .nullish();

/**
 * One entitled tour plus its optional visit schedule. Replaces the old flat
 * `tourIds: string[]` — a tour now carries an optional planned visit date (and
 * start time) that seeds the mobile prep-reminder schedule.
 */
const tourEntrySchema = z.object({
  tourId: z.string().trim().min(1),
  tourDate: visitDateSchema,
  startTime: startTimeSchema,
});

export const createTourAccessSchema = z
  .object({
    phone: phoneSchema,
    pin: pinSchema,
    email: z.string().trim().email("Valid email is required").optional(),
    activatedAt: activatedAtSchema,
    expiresAt: expiresAtSchema,
    maxDevices: z.coerce.number().int().min(1).max(20).default(1),
    allowSubscriptionFeatures: z.boolean().default(false),
    notes: z.string().trim().max(1000).optional(),
    tours: z
      .array(tourEntrySchema)
      .min(1, "At least one tour is required"),
  })
  .refine((value) => value.expiresAt > value.activatedAt, {
    message: "Expiry date must be after the activation date",
    path: ["expiresAt"],
  });

export const updateTourAccessSchema = z
  .object({
    phone: phoneSchema.optional(),
    /** Only sent when the admin is resetting the PIN; absent leaves it alone. */
    pin: pinSchema.optional(),
    email: z.string().trim().email().nullable().optional(),
    activatedAt: activatedAtSchema.optional(),
    expiresAt: expiresAtSchema.optional(),
    maxDevices: z.coerce.number().int().min(1).max(20).optional(),
    allowSubscriptionFeatures: z.boolean().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    tours: z.array(tourEntrySchema).min(1).optional(),
    status: z.enum(["ACTIVE", "REVOKED"]).optional(),
  })
  .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
    message: "At least one field is required",
  })
  .refine(
    (value) =>
      value.activatedAt === undefined ||
      value.expiresAt === undefined ||
      value.expiresAt > value.activatedAt,
    {
      message: "Expiry date must be after the activation date",
      path: ["expiresAt"],
    },
  );

export const listTourAccessQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: tourAccessStatusSchema.optional(),
});

export const analyticsRangeSchema = z.enum(["7d", "30d", "12m", "yearly"]);

export const tourAccessAnalyticsQuerySchema = z.object({
  range: analyticsRangeSchema.default("7d"),
});

export const tourAccessIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export const tourAccessSessionParamSchema = z.object({
  id: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
});

export type CreateTourAccessInput = z.output<typeof createTourAccessSchema>;
export type UpdateTourAccessInput = z.output<typeof updateTourAccessSchema>;
export type ListTourAccessQuery = z.output<typeof listTourAccessQuerySchema>;
export type AnalyticsRange = z.output<typeof analyticsRangeSchema>;
export type TourAccessAnalyticsQuery = z.output<typeof tourAccessAnalyticsQuerySchema>;
