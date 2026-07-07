import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { subscriptionPurchaseService } from "@/services/subscription-purchase.service";
import type { ListParams } from "@/types/api";
import type { SubscriptionPurchaseStatus } from "@/types/subscription-purchase";

export function useSubscriptionPurchases(
  params?: ListParams & { status?: SubscriptionPurchaseStatus; email?: string },
) {
  return useQuery({
    queryKey: queryKeys.subscriptionPurchases.list(params),
    queryFn: () => subscriptionPurchaseService.list(params),
  });
}
