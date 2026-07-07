import type { Prisma, PurchaseStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/repository/base.repository";

const LIST_INCLUDE = {
  plan: { select: { id: true, name: true, durationInDays: true } },
  tours: { include: { tour: { select: { id: true, slug: true } } } },
} satisfies Prisma.SubscriptionPurchaseInclude;

type FindManyOptions = {
  page: number;
  limit: number;
  status?: PurchaseStatus;
  email?: string;
};

export const subscriptionPurchaseRepository = {
  findMany(options: FindManyOptions) {
    const { skip, take } = getPagination(options.page, options.limit);
    const where: Prisma.SubscriptionPurchaseWhereInput = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.email) {
      where.email = { contains: options.email, mode: "insensitive" };
    }

    return Promise.all([
      prisma.subscriptionPurchase.findMany({
        where,
        skip,
        take,
        include: LIST_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscriptionPurchase.count({ where }),
    ]).then(([records, total]) => ({ records, total }));
  },

  findById(id: string) {
    return prisma.subscriptionPurchase.findUnique({
      where: { id },
      include: LIST_INCLUDE,
    });
  },

  findByStripePaymentIntentId(stripePaymentIntentId: string) {
    return prisma.subscriptionPurchase.findUnique({
      where: { stripePaymentIntentId },
    });
  },

  create(data: Prisma.SubscriptionPurchaseCreateInput) {
    return prisma.subscriptionPurchase.create({
      data,
      include: LIST_INCLUDE,
    });
  },

  update(id: string, data: Prisma.SubscriptionPurchaseUpdateInput) {
    return prisma.subscriptionPurchase.update({ where: { id }, data });
  },

  getActivePlan(planId: string) {
    return prisma.subscriptionPlan.findFirst({
      where: { id: planId, isActive: true },
    });
  },

  getActiveTier(deviceCount: number) {
    return prisma.devicePricingTier.findFirst({
      where: { deviceCount, isActive: true },
    });
  },

  getPricingSettings() {
    return prisma.subscriptionPricingSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
  },

  findPublishedTours(tourIds: string[]) {
    return prisma.tour.findMany({
      where: { id: { in: tourIds } },
      select: { id: true, publishStatus: true },
    });
  },
};
