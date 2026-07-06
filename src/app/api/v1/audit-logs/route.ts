import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { auditLogController } from "@/modules/audit-log";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return auditLogController.list(req);
});
