import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";
import { tourAccessService } from "@/services/tour-access.service";

export function useTourAccessSessions(accessId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tourAccess.sessions(accessId ?? ""),
    queryFn: () => tourAccessService.listSessions(accessId!),
    enabled: Boolean(accessId),
  });
}
