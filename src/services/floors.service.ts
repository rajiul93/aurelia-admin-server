import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type {
  CreateFloorPayload,
  CreateTransitionPointPayload,
  Floor,
  TransitionPoint,
  UpdateFloorPayload,
  UpdateTransitionPointPayload,
} from "@/types/floor";

export const floorsService = {
  list(tourId: string) {
    return apiClient
      .get<ApiSuccess<Floor[]>>(`/tours/${tourId}/floors`)
      .then((response) => response.data);
  },

  getById(tourId: string, floorId: string) {
    return apiClient
      .get<ApiSuccess<Floor>>(`/tours/${tourId}/floors/${floorId}`)
      .then((response) => response.data);
  },

  create(tourId: string, payload: CreateFloorPayload) {
    return apiClient
      .post<ApiSuccess<Floor>>(`/tours/${tourId}/floors`, payload)
      .then((response) => response.data);
  },

  update(tourId: string, floorId: string, payload: UpdateFloorPayload) {
    return apiClient
      .patch<ApiSuccess<Floor>>(`/tours/${tourId}/floors/${floorId}`, payload)
      .then((response) => response.data);
  },

  remove(tourId: string, floorId: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(
        `/tours/${tourId}/floors/${floorId}`,
      )
      .then((response) => response.data);
  },

  listTransitionPoints(tourId: string, floorId: string) {
    return apiClient
      .get<ApiSuccess<TransitionPoint[]>>(
        `/tours/${tourId}/floors/${floorId}/transition-points`,
      )
      .then((response) => response.data);
  },

  createTransitionPoint(
    tourId: string,
    floorId: string,
    payload: CreateTransitionPointPayload,
  ) {
    return apiClient
      .post<ApiSuccess<TransitionPoint>>(
        `/tours/${tourId}/floors/${floorId}/transition-points`,
        payload,
      )
      .then((response) => response.data);
  },

  updateTransitionPoint(
    tourId: string,
    floorId: string,
    pointId: string,
    payload: UpdateTransitionPointPayload,
  ) {
    return apiClient
      .patch<ApiSuccess<TransitionPoint>>(
        `/tours/${tourId}/floors/${floorId}/transition-points/${pointId}`,
        payload,
      )
      .then((response) => response.data);
  },

  removeTransitionPoint(tourId: string, floorId: string, pointId: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(
        `/tours/${tourId}/floors/${floorId}/transition-points/${pointId}`,
      )
      .then((response) => response.data);
  },
};
