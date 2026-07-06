import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourBundlesService } from "@/services/tour-bundles.service";

export function useBuildTourBundle(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => tourBundlesService.build(tourId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourBundles.latest(tourId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tours.detail(tourId),
      });
    },
  });
}
