import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourBundlesService } from "@/services/tour-bundles.service";

export function useLatestTourBundle(tourId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tourBundles.latest(tourId),
    queryFn: () => tourBundlesService.getLatest(tourId),
    enabled: Boolean(tourId) && enabled,
    retry: false,
  });
}
