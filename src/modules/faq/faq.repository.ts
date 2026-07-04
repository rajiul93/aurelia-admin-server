import type { Language, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";

const includeRelations = {
  translations: {
    orderBy: { language: "asc" as const },
  },
  category: {
    include: {
      translations: {
        orderBy: { language: "asc" as const },
      },
    },
  },
} satisfies Prisma.FaqInclude;

type FindManyOptions = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  language?: Language;
};

export const faqRepository = {
  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.FaqWhereInput = {};

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.search) {
      where.translations = {
        some: {
          ...(options.language ? { language: options.language } : {}),
          OR: [
            { question: { contains: options.search, mode: "insensitive" } },
            { answer_text: { contains: options.search, mode: "insensitive" } },
          ],
        },
      };
    } else if (options.language) {
      where.translations = {
        some: { language: options.language },
      };
    }

    return Promise.all([
      prisma.faq.findMany({
        where,
        skip,
        take,
        include: includeRelations,
        orderBy: { createdAt: "desc" },
      }),
      prisma.faq.count({ where }),
    ]).then(([faqs, total]) => ({ faqs, total }));
  },

  findById(id: string) {
    return prisma.faq.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  create(data: Prisma.FaqCreateInput) {
    return prisma.faq.create({
      data,
      include: includeRelations,
    });
  },

  update(id: string, data: Prisma.FaqUpdateInput) {
    return prisma.faq.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  delete(id: string) {
    return prisma.faq.delete({ where: { id } });
  },
};
