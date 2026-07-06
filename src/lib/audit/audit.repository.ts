import type { AuditActionType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";

type FindManyOptions = {
  page: number;
  limit: number;
  module?: string;
  actionType?: AuditActionType;
  entityId?: string;
  staffAuthUserId?: string;
};

export const auditRepository = {
  create(data: Prisma.AuditLogCreateInput) {
    return prisma.auditLog.create({ data });
  },

  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.AuditLogWhereInput = {};

    if (options.module) {
      where.module = options.module;
    }

    if (options.actionType) {
      where.actionType = options.actionType;
    }

    if (options.entityId) {
      where.entityId = options.entityId;
    }

    if (options.staffAuthUserId) {
      where.staffAuthUserId = options.staffAuthUserId;
    }

    return Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]).then(([records, total]) => ({ records, total }));
  },
};
