import { z } from "zod";

export const updateSubscriptionPricingSettingsSchema = z.object({
  currency: z.string().trim().length(3).toUpperCase().optional(),
  multiDeviceDiscountEnabled: z.boolean().optional(),
  multiDeviceDiscountPercent: z.number().min(0).max(100).optional(),
  maxDevicesPerPurchase: z.number().int().min(1).max(500).optional(),
});

export type UpdateSubscriptionPricingSettingsInput = z.infer<
  typeof updateSubscriptionPricingSettingsSchema
>;
