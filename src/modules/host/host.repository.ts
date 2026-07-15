import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const hostIncludeRelations = {
  photoMedia: true,
  translations: true,
} satisfies Prisma.HostInclude;

export type HostWithRelations = Prisma.HostGetPayload<{
  include: typeof hostIncludeRelations;
}>;

export const hostRepository = {
  findByTourId(tourId: string) {
    return prisma.host.findMany({
      where: { tourId },
      include: hostIncludeRelations,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  },

  // Scoped by tour so a hostId from another tour can never resolve here.
  findById(tourId: string, hostId: string) {
    return prisma.host.findFirst({
      where: { id: hostId, tourId },
      include: hostIncludeRelations,
    });
  },

  create(tourId: string, data: Prisma.HostCreateWithoutTourInput) {
    return prisma.host.create({
      data: {
        tour: { connect: { id: tourId } },
        ...data,
      },
      include: hostIncludeRelations,
    });
  },

  update(hostId: string, data: Prisma.HostUpdateInput) {
    return prisma.host.update({
      where: { id: hostId },
      data,
      include: hostIncludeRelations,
    });
  },

  delete(hostId: string) {
    return prisma.host.delete({
      where: { id: hostId },
    });
  },
};
