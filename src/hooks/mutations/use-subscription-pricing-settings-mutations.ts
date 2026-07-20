import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { subscriptionPricingSettingsService } from "@/services/subscription-pricing-settings.service";
import type { UpdateSubscriptionPricingSettingsPayload } from "@/types/subscription-pricing-settings";

export function useUpdateSubscriptionPricingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Pricing settings updated" },
    mutationFn: (payload: UpdateSubscriptionPricingSettingsPayload) =>
      subscriptionPricingSettingsService.update(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionPricingSettings.all,
      });
    },
  });
}
