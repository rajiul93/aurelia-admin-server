import { useQuery } from "@tanstack/react-query";
import { floorsService } from "@/services/floors.service";
import { queryKeys } from "@/lib/query/keys";

export function useFloors(tourId: string) {
  return useQuery({
    queryKey: queryKeys.floors.byTour(tourId),
    queryFn: () => floorsService.listByTour(tourId),
  });
}

export function useFloor(tourId: string, floorId: string) {
  return useQuery({
    queryKey: queryKeys.floors.detail(tourId, floorId),
    queryFn: () => floorsService.getById(tourId, floorId),
    enabled: !!tourId && !!floorId,
  });
}
