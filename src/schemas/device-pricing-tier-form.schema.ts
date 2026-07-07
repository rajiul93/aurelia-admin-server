import { z } from "zod";

export const devicePricingTierFormSchema = z.object({
  deviceCount: z.number().int().min(2, "Must be at least 2 devices").max(500),
  additionalPrice: z.number().min(0, "Must be 0 or more"),
  isActive: z.boolean(),
});

export type DevicePricingTierFormInput = z.infer<
  typeof devicePricingTierFormSchema
>;
