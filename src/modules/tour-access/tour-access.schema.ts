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
    tourIds: z
      .array(z.string().trim().min(1))
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
    tourIds: z.array(z.string().trim().min(1)).min(1).optional(),
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
