import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { subscriptionPlanService } from "@/services/subscription-plan.service";

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans.lists(),
    queryFn: () => subscriptionPlanService.list(),
  });
}

export function useSubscriptionPlan(id: string) {
  return useQuery({
    queryKey: queryKeys.subscriptionPlans.detail(id),
    queryFn: () => subscriptionPlanService.getById(id),
    enabled: Boolean(id),
  });
}
