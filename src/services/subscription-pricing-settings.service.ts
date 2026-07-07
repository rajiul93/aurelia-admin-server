import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type {
  SubscriptionPricingSettings,
  UpdateSubscriptionPricingSettingsPayload,
} from "@/types/subscription-pricing-settings";

export const subscriptionPricingSettingsService = {
  get() {
    return apiClient
      .get<ApiSuccess<SubscriptionPricingSettings>>(
        "/subscription-pricing-settings",
      )
      .then((response) => response.data);
  },

  update(payload: UpdateSubscriptionPricingSettingsPayload) {
    return apiClient
      .patch<ApiSuccess<SubscriptionPricingSettings>>(
        "/subscription-pricing-settings",
        payload,
      )
      .then((response) => response.data);
  },
};
