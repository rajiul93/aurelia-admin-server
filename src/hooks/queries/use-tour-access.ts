import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourAccessService } from "@/services/tour-access.service";
import type { ListParams } from "@/types/api";
import type { TourAccessStatus } from "@/types/tour-access";

export function useTourAccessList(
  params?: ListParams & { status?: TourAccessStatus; search?: string },
) {
  return useQuery({
    queryKey: queryKeys.tourAccess.list(params),
    queryFn: () => tourAccessService.list(params),
  });
}

export function useTourAccess(id: string) {
  return useQuery({
    queryKey: queryKeys.tourAccess.detail(id),
    queryFn: () => tourAccessService.getById(id),
    enabled: Boolean(id),
  });
}
