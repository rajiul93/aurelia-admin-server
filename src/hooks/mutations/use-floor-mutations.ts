import { useMutation, useQueryClient } from "@tanstack/react-query";
import { floorsService } from "@/services/floors.service";
import { queryKeys } from "@/lib/query/keys";

export function useCreateFloor(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { floorNo: number; mapTileUrl?: string }) =>
      floorsService.create(tourId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.byTour(tourId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tours.detail(tourId) });
    },
  });
}

export function useUpdateFloor(tourId: string, floorId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { floorNo?: number; mapTileUrl?: string | null }) =>
      floorsService.update(tourId, floorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.detail(tourId, floorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.byTour(tourId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tours.detail(tourId) });
    },
  });
}

export function useDeleteFloor(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (floorId: string) => floorsService.delete(tourId, floorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.floors.byTour(tourId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tours.detail(tourId) });
    },
  });
}
