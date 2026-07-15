import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourRouteService } from "@/services/tour-route.service";

export function useTourRoute(tourId: string, floorId: string) {
  return useQuery({
    queryKey: queryKeys.tourRoute.detail(tourId, floorId),
    queryFn: () => tourRouteService.getByFloor(tourId, floorId),
    enabled: Boolean(tourId) && Boolean(floorId),
  });
}
