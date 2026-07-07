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
    mutationFn: (id: string) => devicePricingTierService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.devicePricingTiers.lists(),
      });
    },
  });
}
