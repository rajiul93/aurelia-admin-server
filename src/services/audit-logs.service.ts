import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type { AuditLog } from "@/types/audit-log";

export type ListAuditLogsParams = ListParams & {
  module?: string;
  actionType?: string;
  entityId?: string;
  staffAuthUserId?: string;
};

export const auditLogsService = {
  list(params?: ListAuditLogsParams) {
    return apiClient
      .get<ApiSuccess<AuditLog[]>>("/audit-logs", { params })
      .then((response) => response.data);
  },
};
