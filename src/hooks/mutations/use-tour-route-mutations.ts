import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourRouteService } from "@/services/tour-route.service";
import type {
  CreateRouteEdgePayload,
  UpdateRouteEdgePayload,
} from "@/types/tour-route";

function useRouteInvalidation(tourId: string, floorId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tourRoute.detail(tourId, floorId),
    });
    // Floor cards show the route's edge count.
    void queryClient.invalidateQueries({
      queryKey: queryKeys.floors.byTour(tourId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.tours.detail(tourId),
    });
  };
}

export function useGenerateTourRoute(tourId: string, floorId: string) {
  const invalidate = useRouteInvalidation(tourId, floorId);

  return useMutation({
    meta: { successMessage: "Route generated" },
    mutationFn: () => tourRouteService.generateFromSpots(tourId, floorId),
    onSuccess: invalidate,
  });
}

export function useGenerateRouteFootprints(tourId: string, floorId: string) {
  const invalidate = useRouteInvalidation(tourId, floorId);

  return useMutation({
    meta: { successMessage: "Footprints generated" },
    mutationFn: () =>
      tourRouteService.generateFootprintsFromOsrm(tourId, floorId),
    onSuccess: invalidate,
  });
}

export function useCreateRouteEdge(tourId: string, floorId: string) {
  const invalidate = useRouteInvalidation(tourId, floorId);

  return useMutation({
    meta: { successMessage: "Route edge created" },
    mutationFn: (payload: CreateRouteEdgePayload) =>
      tourRouteService.createEdge(tourId, floorId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateRouteEdge(tourId: string, floorId: string) {
  const invalidate = useRouteInvalidation(tourId, floorId);

  return useMutation({
    meta: { successMessage: "Route edge updated" },
    mutationFn: ({
      edgeId,
      payload,
    }: {
      edgeId: string;
      payload: UpdateRouteEdgePayload;
    }) => tourRouteService.updateEdge(tourId, floorId, edgeId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteRouteEdge(tourId: string, floorId: string) {
  const invalidate = useRouteInvalidation(tourId, floorId);

  return useMutation({
    meta: { successMessage: "Route edge deleted" },
    mutationFn: (edgeId: string) =>
      tourRouteService.removeEdge(tourId, floorId, edgeId),
    onSuccess: invalidate,
  });
}
