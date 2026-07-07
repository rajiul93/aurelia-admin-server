import { z } from "zod";

export const subscriptionPricingSettingsFormSchema = z.object({
  currency: z.string().trim().length(3, "Use a 3-letter currency code"),
  multiDeviceDiscountEnabled: z.boolean(),
  multiDeviceDiscountPercent: z.number().min(0).max(100),
  maxDevicesPerPurchase: z.number().int().min(1).max(500),
});

export type SubscriptionPricingSettingsFormInput = z.infer<
  typeof subscriptionPricingSettingsFormSchema
>;
