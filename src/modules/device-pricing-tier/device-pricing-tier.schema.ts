import { z } from "zod";

export const createDevicePricingTierSchema = z.object({
  deviceCount: z.coerce.number().int().min(2).max(500),
  additionalPrice: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
});

export const updateDevicePricingTierSchema = z
  .object({
    deviceCount: z.coerce.number().int().min(2).max(500).optional(),
    additionalPrice: z.coerce.number().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.deviceCount !== undefined ||
      value.additionalPrice !== undefined ||
      value.isActive !== undefined,
    { message: "At least one field is required" },
  );

export const devicePricingTierIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export type CreateDevicePricingTierInput = z.output<
  typeof createDevicePricingTierSchema
>;
export type UpdateDevicePricingTierInput = z.output<
  typeof updateDevicePricingTierSchema
>;
