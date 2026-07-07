import { z } from "zod";

export const createSubscriptionPlanSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  durationInDays: z.coerce.number().int().min(1).max(3650),
  basePrice: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const updateSubscriptionPlanSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    durationInDays: z.coerce.number().int().min(1).max(3650).optional(),
    basePrice: z.coerce.number().min(0).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.durationInDays !== undefined ||
      value.basePrice !== undefined ||
      value.isActive !== undefined ||
      value.sortOrder !== undefined,
    { message: "At least one field is required" },
  );

export const subscriptionPlanIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export type CreateSubscriptionPlanInput = z.output<
  typeof createSubscriptionPlanSchema
>;
export type UpdateSubscriptionPlanInput = z.output<
  typeof updateSubscriptionPlanSchema
>;
