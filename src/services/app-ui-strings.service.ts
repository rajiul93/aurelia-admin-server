import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  AppUiString,
  CreateAppUiStringPayload,
  FeatureLifecycle,
  UpdateAppUiStringPayload,
} from "@/types/app-content";

export const appUiStringsService = {
  list(params?: ListParams & { lifecycle?: FeatureLifecycle; search?: string }) {
    return apiClient
      .get<ApiSuccess<AppUiString[]>>("/app-ui-strings", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<AppUiString>>(`/app-ui-strings/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateAppUiStringPayload) {
    return apiClient
      .post<ApiSuccess<AppUiString>>("/app-ui-strings", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateAppUiStringPayload) {
    return apiClient
      .patch<ApiSuccess<AppUiString>>(`/app-ui-strings/${id}`, payload)
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/app-ui-strings/${id}`)
      .then((response) => response.data);
  },
};
