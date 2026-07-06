import { z } from "zod";

const tourAccessStatusSchema = z.enum(["ACTIVE", "REVOKED", "EXPIRED"]);

function parseExpiresAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

const expiresAtSchema = z
  .string()
  .trim()
  .min(1, "Expiration date is required")
  .refine((value) => parseExpiresAt(value) !== null, {
    message: "Invalid expiration date",
  })
  .transform((value) => parseExpiresAt(value)!);

export const createTourAccessSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  expiresAt: expiresAtSchema,
  ticketCount: z.coerce.number().int().min(1).max(20).default(1),
  allowSubscriptionFeatures: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional(),
  tourIds: z
    .array(z.string().trim().min(1))
    .min(1, "At least one tour is required"),
});

export const updateTourAccessSchema = z
  .object({
    email: z.string().trim().email().optional(),
    expiresAt: expiresAtSchema.optional(),
    ticketCount: z.coerce.number().int().min(1).max(20).optional(),
    allowSubscriptionFeatures: z.boolean().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    tourIds: z.array(z.string().trim().min(1)).min(1).optional(),
    status: z.enum(["ACTIVE", "REVOKED"]).optional(),
  })
  .refine(
    (value) =>
      value.email !== undefined ||
      value.expiresAt !== undefined ||
      value.ticketCount !== undefined ||
      value.allowSubscriptionFeatures !== undefined ||
      value.notes !== undefined ||
      value.tourIds !== undefined ||
      value.status !== undefined,
    { message: "At least one field is required" },
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
