import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourAccessService } from "@/services/tour-access.service";
import type { ListParams } from "@/types/api";
import type { AnalyticsRange, TourAccessStatus } from "@/types/tour-access";

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

export function useTourAccessAnalyticsSeries(range: AnalyticsRange) {
  return useQuery({
    queryKey: queryKeys.tourAccess.analyticsSeries(range),
    queryFn: () => tourAccessService.getAnalyticsSeries(range),
    // Keep the chart's previous render while a new range loads, instead of
    // flashing a skeleton on every filter change.
    placeholderData: keepPreviousData,
  });
}

export function useTourAccessAnalyticsSummary() {
  return useQuery({
    queryKey: queryKeys.tourAccess.analyticsSummary(),
    queryFn: () => tourAccessService.getAnalyticsSummary(),
  });
}
