import type { AuditActionType } from "@/generated/prisma/client";
import { auditRepository } from "./audit.repository";

export type AuditContext = {
  staffAuthUserId?: string;
  ipAddress?: string | null;
};

export const auditService = {
  async log(params: {
    module: string;
    actionType: AuditActionType;
    entityId?: string;
    previousValue?: unknown;
    newValue?: unknown;
    context?: AuditContext;
  }) {
    await auditRepository.create({
      module: params.module,
      actionType: params.actionType,
      entityId: params.entityId,
      previousValue: params.previousValue as never,
      newValue: params.newValue as never,
      staffAuthUserId: params.context?.staffAuthUserId,
      ipAddress: params.context?.ipAddress ?? undefined,
    });
  },
};
