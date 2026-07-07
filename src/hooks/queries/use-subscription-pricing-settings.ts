import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { subscriptionPricingSettingsService } from "@/services/subscription-pricing-settings.service";

export function useSubscriptionPricingSettings() {
  return useQuery({
    queryKey: queryKeys.subscriptionPricingSettings.all,
    queryFn: () => subscriptionPricingSettingsService.get(),
  });
}
