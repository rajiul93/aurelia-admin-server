import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { subscriptionPlanService } from "@/services/subscription-plan.service";
import type {
  CreateSubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
} from "@/types/subscription-plan";

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSubscriptionPlanPayload) =>
      subscriptionPlanService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionPlans.lists(),
      });
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSubscriptionPlanPayload;
    }) => subscriptionPlanService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionPlans.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionPlans.detail(variables.id),
      });
    },
  });
}

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionPlanService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptionPlans.lists(),
      });
    },
  });
}
