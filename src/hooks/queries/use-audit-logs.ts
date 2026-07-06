import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";
import {
  auditLogsService,
  type ListAuditLogsParams,
} from "@/services/audit-logs.service";

export function useAuditLogs(params?: ListAuditLogsParams) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => auditLogsService.list(params),
  });
}
