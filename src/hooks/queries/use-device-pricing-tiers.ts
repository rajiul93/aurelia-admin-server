import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { devicePricingTierService } from "@/services/device-pricing-tier.service";

export function useDevicePricingTiers() {
  return useQuery({
    queryKey: queryKeys.devicePricingTiers.lists(),
    queryFn: () => devicePricingTierService.list(),
  });
}

export function useDevicePricingTier(id: string) {
  return useQuery({
    queryKey: queryKeys.devicePricingTiers.detail(id),
    queryFn: () => devicePricingTierService.getById(id),
    enabled: Boolean(id),
  });
}
