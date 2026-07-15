import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type {
  CreateRouteEdgePayload,
  RouteEdge,
  TourRoute,
  UpdateRouteEdgePayload,
} from "@/types/tour-route";

// A route belongs to a floor, not a tour — every call names the floor it edits.
function routeBase(tourId: string, floorId: string) {
  return `/tours/${tourId}/floors/${floorId}/route`;
}

export const tourRouteService = {
  getByFloor(tourId: string, floorId: string) {
    return apiClient
      .get<ApiSuccess<TourRoute>>(routeBase(tourId, floorId))
      .then((response) => response.data);
  },

  generateFromSpots(tourId: string, floorId: string) {
    return apiClient
      .post<ApiSuccess<TourRoute>>(`${routeBase(tourId, floorId)}/generate`)
      .then((response) => response.data);
  },

  generateFootprintsFromOsrm(tourId: string, floorId: string) {
    return apiClient
      .post<ApiSuccess<TourRoute>>(
        `${routeBase(tourId, floorId)}/generate-footprints`,
      )
      .then((response) => response.data);
  },

  createEdge(
    tourId: string,
    floorId: string,
    payload: CreateRouteEdgePayload,
  ) {
    return apiClient
      .post<ApiSuccess<RouteEdge>>(
        `${routeBase(tourId, floorId)}/edges`,
        payload,
      )
      .then((response) => response.data);
  },

  updateEdge(
    tourId: string,
    floorId: string,
    edgeId: string,
    payload: UpdateRouteEdgePayload,
  ) {
    return apiClient
      .patch<ApiSuccess<RouteEdge>>(
        `${routeBase(tourId, floorId)}/edges/${edgeId}`,
        payload,
      )
      .then((response) => response.data);
  },

  removeEdge(tourId: string, floorId: string, edgeId: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(
        `${routeBase(tourId, floorId)}/edges/${edgeId}`,
      )
      .then((response) => response.data);
  },
};
