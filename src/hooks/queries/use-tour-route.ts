import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourRouteService } from "@/services/tour-route.service";

export function useTourRoute(tourId: string) {
  return useQuery({
    queryKey: queryKeys.tourRoute.detail(tourId),
    queryFn: () => tourRouteService.getByTourId(tourId),
    enabled: Boolean(tourId),
  });
}
