import type { Language, Prisma, PublishStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";

export const tourIncludeRelations = {
  translations: {
    orderBy: { language: "asc" as const },
  },
  coverMedia: true,
  floors: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      coverMedia: true,
      translations: {
        orderBy: { language: "asc" as const },
      },
      spots: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          translations: {
            orderBy: { language: "asc" as const },
          },
          faqs: {
            orderBy: { sortOrder: "asc" as const },
            include: {
              translations: {
                orderBy: { language: "asc" as const },
              },
            },
          },
          media: {
            orderBy: { sortOrder: "asc" as const },
            include: {
              media: true,
              thumbnailMedia: true,
            },
          },
        },
      },
      transitionPoints: {
        orderBy: { sortOrder: "asc" as const },
      },
      route: {
        include: {
          edges: {
            orderBy: { sortOrder: "asc" as const },
          },
        },
      },
    },
  },
  aiKnowledge: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      translations: {
        orderBy: { language: "asc" as const },
      },
    },
  },
} satisfies Prisma.TourInclude;

/**
 * The list view's include. Deliberately separate from (and far shallower than)
 * tourIncludeRelations: the list renders a cover, a title, a status, a slug and
 * a spot count, so loading every spot with its translations, FAQs, media joins
 * and route edges — for every tour on the page — was fetching megabytes to
 * render a number. Spots hang off Floor, so the count is aggregated per floor.
 *
 * Keep this narrow. If the list ever needs a new field, add it here rather than
 * reaching for the deep include.
 */
export const tourListInclude = {
  translations: {
    orderBy: { language: "asc" as const },
  },
  coverMedia: true,
  floors: {
    select: {
      _count: { select: { spots: true } },
    },
  },
} satisfies Prisma.TourInclude;

export type TourListRecord = Prisma.TourGetPayload<{
  include: typeof tourListInclude;
}>;

type FindManyOptions = {
  page: number;
  limit: number;
  search?: string;
  publishStatus?: PublishStatus;
  language?: Language;
};

export const tourRepository = {
  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.TourWhereInput = {};

    if (options.publishStatus) {
      where.publishStatus = options.publishStatus;
    }

    if (options.search) {
      where.OR = [
        { slug: { contains: options.search, mode: "insensitive" } },
        {
          translations: {
            some: {
              ...(options.language ? { language: options.language } : {}),
              OR: [
                { title: { contains: options.search, mode: "insensitive" } },
                {
                  description: {
                    contains: options.search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ];
    } else if (options.language) {
      where.translations = {
        some: { language: options.language },
      };
    }

    return Promise.all([
      prisma.tour.findMany({
        where,
        skip,
        take,
        include: tourListInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tour.count({ where }),
    ]).then(([tours, total]) => ({ tours, total }));
  },

  findById(id: string) {
    return prisma.tour.findUnique({
      where: { id },
      include: tourIncludeRelations,
    });
  },

  findBySlug(slug: string) {
    return prisma.tour.findUnique({
      where: { slug },
      include: tourIncludeRelations,
    });
  },

  create(data: Prisma.TourCreateInput) {
    return prisma.tour.create({
      data,
      include: tourIncludeRelations,
    });
  },

  update(id: string, data: Prisma.TourUpdateInput) {
    return prisma.tour.update({
      where: { id },
      data,
      include: tourIncludeRelations,
    });
  },

  delete(id: string) {
    return prisma.tour.delete({ where: { id } });
  },

  // The floor the admin API falls back to when a request doesn't name one.
  // Prefers Floor 1, but any tour whose floors are numbered differently (e.g. a
  // ground floor at 0) still resolves to its lowest floor rather than nothing.
  getFloor1ByTourId(tourId: string) {
    return prisma.floor.findFirst({
      where: { tourId },
      orderBy: { floorNo: "asc" },
    });
  },
};
