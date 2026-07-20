import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { devicePricingTierService } from "@/services/device-pricing-tier.service";
import type {
  CreateDevicePricingTierPayload,
  UpdateDevicePricingTierPayload,
} from "@/types/device-pricing-tier";

export function useCreateDevicePricingTier() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Pricing tier created" },
    mutationFn: (payload: CreateDevicePricingTierPayload) =>
      devicePricingTierService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.devicePricingTiers.lists(),
      });
    },
  });
}

export function useUpdateDevicePricingTier() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Pricing tier updated" },
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDevicePricingTierPayload;
    }) => devicePricingTierService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.devicePricingTiers.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.devicePricingTiers.detail(variables.id),
      });
    },
  });
}

export function useDeleteDevicePricingTier() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Pricing tier deleted" },
    mutationFn: (id: string) => devicePricingTierService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.devicePricingTiers.lists(),
      });
    },
  });
}
