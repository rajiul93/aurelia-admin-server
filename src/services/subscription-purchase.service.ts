import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  SubscriptionPurchase,
  SubscriptionPurchaseStatus,
} from "@/types/subscription-purchase";

export const subscriptionPurchaseService = {
  list(
    params?: ListParams & { status?: SubscriptionPurchaseStatus; email?: string },
  ) {
    return apiClient
      .get<ApiSuccess<SubscriptionPurchase[]>>("/subscription-purchases", {
        params,
      })
      .then((response) => response.data);
  },
};
