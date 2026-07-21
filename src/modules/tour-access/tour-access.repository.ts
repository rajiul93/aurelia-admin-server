import { Prisma, type TourAccessStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";
import type { BucketGranularity } from "./tour-access-analytics.util";

const includeRelations = {
  tours: {
    include: {
      tour: {
        include: {
          translations: {
            orderBy: { language: "asc" as const },
          },
        },
      },
    },
  },
  deviceSessions: {
    where: { revokedAt: null },
  },
} satisfies Prisma.TourAccessInclude;

type FindManyOptions = {
  page: number;
  limit: number;
  search?: string;
  status?: TourAccessStatus;
};

export const tourAccessRepository = {
  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.TourAccessWhereInput = {};

    if (options.search) {
      where.OR = [
        { phone: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];
    }

    if (options.status === "REVOKED") {
      where.status = "REVOKED";
    } else if (options.status === "EXPIRED") {
      where.status = { not: "REVOKED" };
      where.expiresAt = { lt: new Date() };
    } else if (options.status === "ACTIVE") {
      where.status = "ACTIVE";
      where.expiresAt = { gte: new Date() };
    }

    return Promise.all([
      prisma.tourAccess.findMany({
        where,
        skip,
        take,
        include: includeRelations,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tourAccess.count({ where }),
    ]).then(([records, total]) => ({ records, total }));
  },

  findById(id: string) {
    return prisma.tourAccess.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  create(data: Prisma.TourAccessCreateInput) {
    return prisma.tourAccess.create({
      data,
      include: includeRelations,
    });
  },

  update(id: string, data: Prisma.TourAccessUpdateInput) {
    return prisma.tourAccess.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  delete(id: string) {
    return prisma.tourAccess.delete({ where: { id } });
  },

  sumMaxDevicesByBucket(start: Date, end: Date, granularity: BucketGranularity) {
    return prisma.$queryRaw<{ bucket: Date; total: number }[]>(Prisma.sql`
      SELECT
        date_trunc(${granularity}, "createdAt") AS bucket,
        SUM("maxDevices")::int AS total
      FROM "TourAccess"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY bucket
      ORDER BY bucket ASC
    `);
  },

  async sumMaxDevicesInRange(start: Date, end: Date) {
    const result = await prisma.tourAccess.aggregate({
      _sum: { maxDevices: true },
      where: { createdAt: { gte: start, lt: end } },
    });
    return result._sum.maxDevices ?? 0;
  },

  async sumMaxDevicesTotal() {
    const result = await prisma.tourAccess.aggregate({
      _sum: { maxDevices: true },
    });
    return result._sum.maxDevices ?? 0;
  },

  async earliestCreatedAt() {
    const result = await prisma.tourAccess.aggregate({
      _min: { createdAt: true },
    });
    return result._min.createdAt ?? null;
  },
};
