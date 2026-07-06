import type { FeatureLifecycle, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";

const includeRelations = {
  translations: {
    orderBy: { language: "asc" as const },
  },
} satisfies Prisma.AppUiStringInclude;

type FindManyOptions = {
  page: number;
  limit: number;
  search?: string;
  lifecycle?: FeatureLifecycle;
};

export const appUiStringRepository = {
  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.AppUiStringWhereInput = {};

    if (options.lifecycle) {
      where.lifecycle = options.lifecycle;
    }

    if (options.search) {
      where.OR = [
        { key: { contains: options.search, mode: "insensitive" } },
        {
          translations: {
            some: {
              value: { contains: options.search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    return Promise.all([
      prisma.appUiString.findMany({
        where,
        skip,
        take,
        include: includeRelations,
        orderBy: { key: "asc" },
      }),
      prisma.appUiString.count({ where }),
    ]).then(([records, total]) => ({ records, total }));
  },

  findById(id: string) {
    return prisma.appUiString.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  findByKey(key: string) {
    return prisma.appUiString.findUnique({
      where: { key },
      include: includeRelations,
    });
  },

  create(data: Prisma.AppUiStringCreateInput) {
    return prisma.appUiString.create({
      data,
      include: includeRelations,
    });
  },

  update(id: string, data: Prisma.AppUiStringUpdateInput) {
    return prisma.appUiString.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  delete(id: string) {
    return prisma.appUiString.delete({ where: { id } });
  },
};
