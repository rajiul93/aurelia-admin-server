import type { AuditLog } from "@/generated/prisma/client";

export type AuditLogDto = {
  id: string;
  staffAuthUserId: string | null;
  module: string;
  actionType: string;
  entityId: string | null;
  previousValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  createdAt: string;
};

export function toAuditLogDto(record: AuditLog): AuditLogDto {
  return {
    id: record.id,
    staffAuthUserId: record.staffAuthUserId,
    module: record.module,
    actionType: record.actionType,
    entityId: record.entityId,
    previousValue: record.previousValue,
    newValue: record.newValue,
    ipAddress: record.ipAddress,
    createdAt: record.createdAt.toISOString(),
  };
}

export function toAuditLogDtoList(records: AuditLog[]) {
  return records.map(toAuditLogDto);
}
