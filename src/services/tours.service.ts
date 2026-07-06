import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  CreateTourPayload,
  PublishStatus,
  Tour,
  TourLifecycleAction,
  TourReadiness,
  UpdateTourPayload,
} from "@/types/tour";

export const toursService = {
  list(params?: ListParams & { publishStatus?: PublishStatus; language?: string }) {
    return apiClient
      .get<ApiSuccess<Tour[]>>("/tours", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<Tour>>(`/tours/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateTourPayload) {
    return apiClient
      .post<ApiSuccess<Tour>>("/tours", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateTourPayload) {
    return apiClient
      .patch<ApiSuccess<Tour>>(`/tours/${id}`, payload)
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/tours/${id}`)
      .then((response) => response.data);
  },

  getReadiness(id: string) {
    return apiClient
      .get<ApiSuccess<TourReadiness>>(`/tours/${id}/lifecycle`)
      .then((response) => response.data);
  },

  transition(id: string, action: TourLifecycleAction) {
    return apiClient
      .post<ApiSuccess<Tour>>(`/tours/${id}/lifecycle`, { action })
      .then((response) => response.data);
  },
};
