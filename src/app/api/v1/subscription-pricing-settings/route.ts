import type { SubscriptionPricingSettings } from "@/generated/prisma/client";
import { withErrorHandler } from "@/lib/api/handler";
import { success } from "@/lib/api/response";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { parseBody } from "@/lib/api/validate";
import { subscriptionPricingSettingsRepository } from "@/lib/subscription-pricing/subscription-pricing-settings.repository";
import { updateSubscriptionPricingSettingsSchema } from "@/schemas/subscription-pricing-settings.schema";

function toDto(settings: SubscriptionPricingSettings) {
  return {
    currency: settings.currency,
    multiDeviceDiscountEnabled: settings.multiDeviceDiscountEnabled,
    multiDeviceDiscountPercent: settings.multiDeviceDiscountPercent.toNumber(),
    maxDevicesPerPurchase: settings.maxDevicesPerPurchase,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  const settings = await subscriptionPricingSettingsRepository.getSettings();
  return success(toDto(settings));
});

export const PATCH = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  const body = await parseBody(req, updateSubscriptionPricingSettingsSchema);
  const settings =
    await subscriptionPricingSettingsRepository.updateSettings(body);
  return success(toDto(settings));
});
