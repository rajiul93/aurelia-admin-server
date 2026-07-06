import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { toursService } from "@/services/tours.service";
import type { ListParams } from "@/types/api";
import type { PublishStatus } from "@/types/tour";

export function useTours(
  params?: ListParams & { publishStatus?: PublishStatus; language?: string },
) {
  return useQuery({
    queryKey: queryKeys.tours.list(params),
    queryFn: () => toursService.list(params),
  });
}

export function useTour(id: string) {
  return useQuery({
    queryKey: queryKeys.tours.detail(id),
    queryFn: () => toursService.getById(id),
    enabled: Boolean(id),
  });
}

export function useTourReadiness(id: string) {
  return useQuery({
    queryKey: queryKeys.tourLifecycle.detail(id),
    queryFn: () => toursService.getReadiness(id),
    enabled: Boolean(id),
  });
}
