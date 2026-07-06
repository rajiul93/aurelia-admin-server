import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validate";
import { listAuditLogsQuerySchema } from "./audit-log.schema";
import { auditLogService } from "./audit-log.service";

export const auditLogController = {
  async list(req: NextRequest) {
    const query = parseQuery(req.nextUrl.searchParams, listAuditLogsQuerySchema);
    const result = await auditLogService.list(query);
    return success(result.data, { meta: result.meta });
  },
};
