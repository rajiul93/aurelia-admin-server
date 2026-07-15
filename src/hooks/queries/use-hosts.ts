import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { hostsService } from "@/services/hosts.service";
import type { Host } from "@/types/host";

export function useHosts(tourId: string) {
  return useQuery<Host[]>({
    queryKey: queryKeys.hosts.byTour(tourId),
    queryFn: () => hostsService.list(tourId),
  });
}

export function useHost(tourId: string, hostId: string) {
  return useQuery<Host>({
    queryKey: queryKeys.hosts.detail(tourId, hostId),
    queryFn: () => hostsService.getById(tourId, hostId),
  });
}
