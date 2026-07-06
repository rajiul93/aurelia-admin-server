import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { toursService } from "@/services/tours.service";
import type {
  CreateTourPayload,
  TourLifecycleAction,
  UpdateTourPayload,
} from "@/types/tour";

export function useCreateTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTourPayload) => toursService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tours.lists() });
    },
  });
}

export function useUpdateTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTourPayload;
    }) => toursService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tours.lists() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tours.detail(variables.id),
      });
    },
  });
}

export function useDeleteTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toursService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tours.lists() });
    },
  });
}

export function useTourLifecycle(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: TourLifecycleAction) =>
      toursService.transition(tourId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tours.lists() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tours.detail(tourId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourLifecycle.detail(tourId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourBundles.latest(tourId),
      });
    },
  });
}
