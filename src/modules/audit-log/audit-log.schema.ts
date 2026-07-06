import { z } from "zod";
import type { AuditActionType } from "@/generated/prisma/client";

const auditActionTypes = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PUBLISH",
  "ARCHIVE",
  "ROLLBACK",
  "LOGIN",
  "LOGOUT",
] as const satisfies readonly AuditActionType[];

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  module: z.string().trim().min(1).optional(),
  actionType: z.enum(auditActionTypes).optional(),
  entityId: z.string().trim().min(1).optional(),
  staffAuthUserId: z.string().trim().min(1).optional(),
});

export type ListAuditLogsQuery = z.output<typeof listAuditLogsQuerySchema>;
