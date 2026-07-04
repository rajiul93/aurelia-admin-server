import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const mediaRepository = {
  findById(id: string) {
    return prisma.media.findUnique({ where: { id } });
  },

  findByKey(key: string) {
    return prisma.media.findUnique({ where: { key } });
  },

  create(data: Prisma.MediaCreateInput) {
    return prisma.media.create({ data });
  },

  update(id: string, data: Prisma.MediaUpdateInput) {
    return prisma.media.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.media.delete({ where: { id } });
  },
};
