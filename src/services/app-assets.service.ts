import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  AppAsset,
  CreateAppAssetPayload,
  FeatureLifecycle,
  TimeOfDay,
  UpdateAppAssetPayload,
} from "@/types/app-content";

export const appAssetsService = {
  list(
    params?: ListParams & {
      lifecycle?: FeatureLifecycle;
      timeOfDay?: TimeOfDay;
      search?: string;
    },
  ) {
    return apiClient
      .get<ApiSuccess<AppAsset[]>>("/app-assets", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<AppAsset>>(`/app-assets/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateAppAssetPayload) {
    return apiClient
      .post<ApiSuccess<AppAsset>>("/app-assets", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateAppAssetPayload) {
    return apiClient
      .patch<ApiSuccess<AppAsset>>(`/app-assets/${id}`, payload)
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/app-assets/${id}`)
      .then((response) => response.data);
  },
};
