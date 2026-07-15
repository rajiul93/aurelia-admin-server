import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const floorIncludeRelations = {
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
    },
  },
  route: {
    include: {
      edges: {
        orderBy: { sortOrder: "asc" as const },
      },
    },
  },
  transitionPoints: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      connectsToFloor: {
        include: {
          translations: {
            orderBy: { language: "asc" as const },
          },
        },
      },
    },
  },
} satisfies Prisma.FloorInclude;

export type FloorWithRelations = Prisma.FloorGetPayload<{
  include: typeof floorIncludeRelations;
}>;

export const floorRepository = {
  findByTourId(tourId: string) {
    return prisma.floor.findMany({
      where: { tourId },
      include: floorIncludeRelations,
      orderBy: [{ sortOrder: "asc" }, { floorNo: "asc" }],
    });
  },

  // Scoped by tour so a floorId from another tour can never resolve here.
  findById(tourId: string, floorId: string) {
    return prisma.floor.findFirst({
      where: { id: floorId, tourId },
      include: floorIncludeRelations,
    });
  },

  findByTourAndFloorNo(tourId: string, floorNo: number) {
    return prisma.floor.findFirst({
      where: { tourId, floorNo },
      include: floorIncludeRelations,
    });
  },

  create(tourId: string, data: Prisma.FloorCreateWithoutTourInput) {
    return prisma.$transaction(async (tx) => {
      const floor = await tx.floor.create({
        data: {
          tour: { connect: { id: tourId } },
          ...data,
        },
        include: floorIncludeRelations,
      });

      await tx.tour.update({
        where: { id: tourId },
        data: { routeVersion: { increment: 1 } },
      });

      return floor;
    });
  },

  update(tourId: string, floorId: string, data: Prisma.FloorUpdateInput) {
    return prisma.$transaction(async (tx) => {
      const floor = await tx.floor.update({
        where: { id: floorId },
        data,
        include: floorIncludeRelations,
      });

      await tx.tour.update({
        where: { id: tourId },
        data: { routeVersion: { increment: 1 } },
      });

      return floor;
    });
  },

  delete(tourId: string, floorId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.floor.delete({ where: { id: floorId } });
      await tx.tour.update({
        where: { id: tourId },
        data: { routeVersion: { increment: 1 } },
      });
    });
  },

  findTransitionPointById(floorId: string, pointId: string) {
    return prisma.floorTransitionPoint.findFirst({
      where: { id: pointId, floorId },
      include: { connectsToFloor: true },
    });
  },

  createTransitionPoint(
    floorId: string,
    data: Prisma.FloorTransitionPointCreateWithoutFloorInput,
  ) {
    return prisma.floorTransitionPoint.create({
      data: {
        floor: { connect: { id: floorId } },
        ...data,
      },
      include: { connectsToFloor: true },
    });
  },

  updateTransitionPoint(
    pointId: string,
    data: Prisma.FloorTransitionPointUpdateInput,
  ) {
    return prisma.floorTransitionPoint.update({
      where: { id: pointId },
      data,
      include: { connectsToFloor: true },
    });
  },

  deleteTransitionPoint(pointId: string) {
    return prisma.floorTransitionPoint.delete({ where: { id: pointId } });
  },
};
