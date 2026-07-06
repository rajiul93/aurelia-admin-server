import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  CreateTourAccessPayload,
  DeviceSession,
  TourAccess,
  TourAccessStatus,
  UpdateTourAccessPayload,
} from "@/types/tour-access";

export const tourAccessService = {
  list(params?: ListParams & { status?: TourAccessStatus; search?: string }) {
    return apiClient
      .get<ApiSuccess<TourAccess[]>>("/tour-access", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<TourAccess>>(`/tour-access/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateTourAccessPayload) {
    return apiClient
      .post<ApiSuccess<TourAccess>>("/tour-access", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateTourAccessPayload) {
    return apiClient
      .patch<ApiSuccess<TourAccess>>(`/tour-access/${id}`, payload)
      .then((response) => response.data);
  },

  revoke(id: string) {
    return apiClient
      .post<ApiSuccess<TourAccess>>(`/tour-access/${id}/revoke`)
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/tour-access/${id}`)
      .then((response) => response.data);
  },

  listSessions(accessId: string) {
    return apiClient
      .get<ApiSuccess<DeviceSession[]>>(`/tour-access/${accessId}/sessions`)
      .then((response) => response.data);
  },

  revokeSession(accessId: string, sessionId: string) {
    return apiClient
      .post<
        ApiSuccess<{ revoked: boolean; sessionId: string; deviceId: string }>
      >(`/tour-access/${accessId}/sessions/${sessionId}/revoke`)
      .then((response) => response.data);
  },
};
