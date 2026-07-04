import type { Language, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";

const includeRelations = {
  imageMedia: true,
  translations: {
    orderBy: { language: "asc" as const },
  },
} satisfies Prisma.FaqCategoryInclude;

type FindManyOptions = {
  page: number;
  limit: number;
  search?: string;
  language?: Language;
};

export const faqCategoryRepository = {
  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.FaqCategoryWhereInput = {};

    if (options.search) {
      where.translations = {
        some: {
          ...(options.language ? { language: options.language } : {}),
          OR: [
            { title: { contains: options.search, mode: "insensitive" } },
            { slug: { contains: options.search, mode: "insensitive" } },
          ],
        },
      };
    } else if (options.language) {
      where.translations = {
        some: { language: options.language },
      };
    }

    return Promise.all([
      prisma.faqCategory.findMany({
        where,
        skip,
        take,
        include: includeRelations,
        orderBy: { createdAt: "desc" },
      }),
      prisma.faqCategory.count({ where }),
    ]).then(([categories, total]) => ({ categories, total }));
  },

  findById(id: string) {
    return prisma.faqCategory.findUnique({
      where: { id },
      include: includeRelations,
    });
  },

  findBySlug(slug: string, language: Language) {
    return prisma.faqCategoryTranslation.findUnique({
      where: {
        language_slug: { language, slug },
      },
      include: {
        category: {
          include: includeRelations,
        },
      },
    });
  },

  create(data: Prisma.FaqCategoryCreateInput) {
    return prisma.faqCategory.create({
      data,
      include: includeRelations,
    });
  },

  update(id: string, data: Prisma.FaqCategoryUpdateInput) {
    return prisma.faqCategory.update({
      where: { id },
      data,
      include: includeRelations,
    });
  },

  delete(id: string) {
    return prisma.faqCategory.delete({ where: { id } });
  },

  countFaqs(id: string) {
    return prisma.faq.count({ where: { categoryId: id } });
  },
};
