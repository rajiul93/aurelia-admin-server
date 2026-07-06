import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { spotsService } from "@/services/spots.service";

export function useSpots(tourId: string) {
  return useQuery({
    queryKey: queryKeys.spots.list(tourId),
    queryFn: () => spotsService.list(tourId),
    enabled: Boolean(tourId),
  });
}

export function useSpot(tourId: string, spotId: string) {
  return useQuery({
    queryKey: queryKeys.spots.detail(tourId, spotId),
    queryFn: () => spotsService.getById(tourId, spotId),
    enabled: Boolean(tourId) && Boolean(spotId),
  });
}
