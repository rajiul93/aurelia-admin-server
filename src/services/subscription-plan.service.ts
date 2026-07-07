import { apiClient } from "@/lib/axios";
import type {
  CreateSubscriptionPlanPayload,
  SubscriptionPlan,
  UpdateSubscriptionPlanPayload,
} from "@/types/subscription-plan";
import type { ApiSuccess } from "@/types/api";

export const subscriptionPlanService = {
  list() {
    return apiClient
      .get<ApiSuccess<SubscriptionPlan[]>>("/subscription-plans")
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<SubscriptionPlan>>(`/subscription-plans/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateSubscriptionPlanPayload) {
    return apiClient
      .post<ApiSuccess<SubscriptionPlan>>("/subscription-plans", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateSubscriptionPlanPayload) {
    return apiClient
      .patch<ApiSuccess<SubscriptionPlan>>(
        `/subscription-plans/${id}`,
        payload,
      )
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/subscription-plans/${id}`)
      .then((response) => response.data);
  },
};
