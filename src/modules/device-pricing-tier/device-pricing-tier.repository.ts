import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const devicePricingTierRepository = {
  findMany() {
    return prisma.devicePricingTier.findMany({
      orderBy: { deviceCount: "asc" },
    });
  },

  findById(id: string) {
    return prisma.devicePricingTier.findUnique({ where: { id } });
  },

  create(data: Prisma.DevicePricingTierCreateInput) {
    return prisma.devicePricingTier.create({ data });
  },

  update(id: string, data: Prisma.DevicePricingTierUpdateInput) {
    return prisma.devicePricingTier.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.devicePricingTier.delete({ where: { id } });
  },
};
