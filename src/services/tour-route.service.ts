import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type {
  CreateRouteEdgePayload,
  RouteEdge,
  TourRoute,
  UpdateRouteEdgePayload,
} from "@/types/tour-route";

export const tourRouteService = {
  getByTourId(tourId: string) {
    return apiClient
      .get<ApiSuccess<TourRoute>>(`/tours/${tourId}/route`)
      .then((response) => response.data);
  },

  generateFromSpots(tourId: string) {
    return apiClient
      .post<ApiSuccess<TourRoute>>(`/tours/${tourId}/route/generate`)
      .then((response) => response.data);
  },

  generateFootprintsFromOsrm(tourId: string) {
    return apiClient
      .post<ApiSuccess<TourRoute>>(`/tours/${tourId}/route/generate-footprints`)
      .then((response) => response.data);
  },

  createEdge(tourId: string, payload: CreateRouteEdgePayload) {
    return apiClient
      .post<ApiSuccess<RouteEdge>>(`/tours/${tourId}/route/edges`, payload)
      .then((response) => response.data);
  },

  updateEdge(tourId: string, edgeId: string, payload: UpdateRouteEdgePayload) {
    return apiClient
      .patch<ApiSuccess<RouteEdge>>(
        `/tours/${tourId}/route/edges/${edgeId}`,
        payload,
      )
      .then((response) => response.data);
  },

  removeEdge(tourId: string, edgeId: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(
        `/tours/${tourId}/route/edges/${edgeId}`,
      )
      .then((response) => response.data);
  },
};
