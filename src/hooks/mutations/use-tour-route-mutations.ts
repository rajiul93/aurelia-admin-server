import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourRouteService } from "@/services/tour-route.service";
import type {
  CreateRouteEdgePayload,
  UpdateRouteEdgePayload,
} from "@/types/tour-route";

function invalidateRoute(queryClient: ReturnType<typeof useQueryClient>, tourId: string) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tourRoute.detail(tourId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tours.detail(tourId),
  });
}

export function useGenerateTourRoute(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => tourRouteService.generateFromSpots(tourId),
    onSuccess: () => invalidateRoute(queryClient, tourId),
  });
}

export function useGenerateRouteFootprints(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => tourRouteService.generateFootprintsFromOsrm(tourId),
    onSuccess: () => invalidateRoute(queryClient, tourId),
  });
}

export function useCreateRouteEdge(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRouteEdgePayload) =>
      tourRouteService.createEdge(tourId, payload),
    onSuccess: () => invalidateRoute(queryClient, tourId),
  });
}

export function useUpdateRouteEdge(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      edgeId,
      payload,
    }: {
      edgeId: string;
      payload: UpdateRouteEdgePayload;
    }) => tourRouteService.updateEdge(tourId, edgeId, payload),
    onSuccess: () => invalidateRoute(queryClient, tourId),
  });
}

export function useDeleteRouteEdge(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (edgeId: string) => tourRouteService.removeEdge(tourId, edgeId),
    onSuccess: () => invalidateRoute(queryClient, tourId),
  });
}
