import type {
  KnowledgeCategory,
  Language,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";

const includeRelations = {
  translations: {
    orderBy: { language: "asc" as const },
  },
} satisfies Prisma.KnowledgeArticleInclude;

type FindManyOptions = {
  page: number;
  limit: number;
  search?: string;
  category?: KnowledgeCategory;
  language?: Language;
};

export const knowledgeArticleRepository = {
  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.KnowledgeArticleWhereInput = {};

    if (options.category) {
      where.category = options.category;
    }

    if (options.search) {
      where.translations = {
        some: {
          ...(options.language ? { language: options.language } : {}),
          OR: [
            { title: { contains: options.search, mode: "insensitive" } },
            { bodyText: { contains: options.search, mode: "insensitive" } },
          ],
        },
      };
    }

    return Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        skip,
        take,
        include: includeRelations,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.knowledgeArticle.count({ where }),
    ]).then(([articles, total]) => ({ articles, total }));
  },

  findById(id: string) {
    return prisma.knowledgeArticle.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  create(data: Prisma.KnowledgeArticleCreateInput) {
    return prisma.knowledgeArticle.create({
      data,
      include: includeRelations,
    });
  },

  update(id: string, data: Prisma.KnowledgeArticleUpdateInput) {
    return prisma.knowledgeArticle.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  delete(id: string) {
    return prisma.knowledgeArticle.delete({ where: { id } });
  },
};
