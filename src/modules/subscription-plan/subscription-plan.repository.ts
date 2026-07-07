import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const subscriptionPlanRepository = {
  findMany() {
    return prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: "asc" },
    });
  },

  findById(id: string) {
    return prisma.subscriptionPlan.findUnique({ where: { id } });
  },

  create(data: Prisma.SubscriptionPlanCreateInput) {
    return prisma.subscriptionPlan.create({ data });
  },

  update(id: string, data: Prisma.SubscriptionPlanUpdateInput) {
    return prisma.subscriptionPlan.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.subscriptionPlan.delete({ where: { id } });
  },

  countPurchases(id: string) {
    return prisma.subscriptionPurchase.count({ where: { planId: id } });
  },
};
