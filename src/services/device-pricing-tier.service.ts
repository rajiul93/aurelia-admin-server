import { apiClient } from "@/lib/axios";
import type {
  CreateDevicePricingTierPayload,
  DevicePricingTier,
  UpdateDevicePricingTierPayload,
} from "@/types/device-pricing-tier";
import type { ApiSuccess } from "@/types/api";

export const devicePricingTierService = {
  list() {
    return apiClient
      .get<ApiSuccess<DevicePricingTier[]>>("/device-pricing-tiers")
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<DevicePricingTier>>(`/device-pricing-tiers/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateDevicePricingTierPayload) {
    return apiClient
      .post<ApiSuccess<DevicePricingTier>>("/device-pricing-tiers", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateDevicePricingTierPayload) {
    return apiClient
      .patch<ApiSuccess<DevicePricingTier>>(
        `/device-pricing-tiers/${id}`,
        payload,
      )
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/device-pricing-tiers/${id}`)
      .then((response) => response.data);
  },
};
