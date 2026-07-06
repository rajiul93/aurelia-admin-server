import { auditRepository } from "@/lib/audit/audit.repository";
import { toAuditLogDtoList } from "./audit-log.mapper";
import type { ListAuditLogsQuery } from "./audit-log.schema";

export const auditLogService = {
  async list(query: ListAuditLogsQuery) {
    const { records, total } = await auditRepository.findMany(query);

    return {
      data: toAuditLogDtoList(records),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  },
};
