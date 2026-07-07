import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { UpdateSubscriptionPricingSettingsInput } from "@/schemas/subscription-pricing-settings.schema";

export const subscriptionPricingSettingsRepository = {
  getSettings() {
    return prisma.subscriptionPricingSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
  },

  updateSettings(input: UpdateSubscriptionPricingSettingsInput) {
    const data: Prisma.SubscriptionPricingSettingsUpdateInput = {
      currency: input.currency,
      multiDeviceDiscountEnabled: input.multiDeviceDiscountEnabled,
      multiDeviceDiscountPercent: input.multiDeviceDiscountPercent,
      maxDevicesPerPurchase: input.maxDevicesPerPurchase,
    };

    return prisma.subscriptionPricingSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        currency: input.currency ?? "EUR",
        multiDeviceDiscountEnabled: input.multiDeviceDiscountEnabled ?? true,
        multiDeviceDiscountPercent: input.multiDeviceDiscountPercent ?? 10,
        maxDevicesPerPurchase: input.maxDevicesPerPurchase ?? 10,
      },
      update: data,
    });
  },
};
