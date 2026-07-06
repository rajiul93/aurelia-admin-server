import type {
  FeatureLifecycle,
  Prisma,
  TimeOfDay,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";

const includeRelations = {
  media: true,
} satisfies Prisma.AppAssetInclude;

type FindManyOptions = {
  page: number;
  limit: number;
  search?: string;
  timeOfDay?: TimeOfDay;
  lifecycle?: FeatureLifecycle;
};

export const appAssetRepository = {
  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.AppAssetWhereInput = {};

    if (options.lifecycle) {
      where.lifecycle = options.lifecycle;
    }

    if (options.timeOfDay) {
      where.timeOfDay = options.timeOfDay;
    }

    if (options.search) {
      where.key = { contains: options.search, mode: "insensitive" };
    }

    return Promise.all([
      prisma.appAsset.findMany({
        where,
        skip,
        take,
        include: includeRelations,
        orderBy: { key: "asc" },
      }),
      prisma.appAsset.count({ where }),
    ]).then(([records, total]) => ({ records, total }));
  },

  findById(id: string) {
    return prisma.appAsset.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  findByKey(key: string) {
    return prisma.appAsset.findUnique({
      where: { key },
      include: includeRelations,
    });
  },

  create(data: Prisma.AppAssetCreateInput) {
    return prisma.appAsset.create({
      data,
      include: includeRelations,
    });
  },

  update(id: string, data: Prisma.AppAssetUpdateInput) {
    return prisma.appAsset.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  delete(id: string) {
    return prisma.appAsset.delete({ where: { id } });
  },
};
