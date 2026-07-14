import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const floorIncludeRelations = {
  translations: true,
  spots: {
    include: {
      translations: true,
      media: true,
      faqs: true,
      aiKnowledge: true,
    },
  },
  route: {
    include: {
      edges: {
        include: {
          fromSpot: true,
          toSpot: true,
        },
      },
    },
  },
  transitionPoints: {
    include: {
      connectsToFloor: {
        include: {
          translations: true,
        },
      },
    },
  },
};

export const floorRepository = {
  async findById(id: string) {
    return prisma.floor.findUnique({
      where: { id },
      include: floorIncludeRelations,
    });
  },

  async findByTourId(tourId: string) {
    return prisma.floor.findMany({
      where: { tourId },
      include: floorIncludeRelations,
      orderBy: { sortOrder: "asc" },
    });
  },

  async findByTourAndFloorNo(tourId: string, floorNo: number) {
    return prisma.floor.findFirst({
      where: { tourId, floorNo },
      include: floorIncludeRelations,
    });
  },

  async create(data: Prisma.FloorCreateInput) {
    return prisma.floor.create({
      data,
      include: floorIncludeRelations,
    });
  },

  async update(id: string, data: Prisma.FloorUpdateInput) {
    return prisma.floor.update({
      where: { id },
      data,
      include: floorIncludeRelations,
    });
  },

  async delete(id: string) {
    return prisma.floor.delete({
      where: { id },
    });
  },

  async createTransitionPoint(floorId: string, data: any) {
    return prisma.floorTransitionPoint.create({
      data: {
        ...data,
        floorId,
      },
      include: {
        floor: true,
        connectsToFloor: true,
      },
    });
  },

  async updateTransitionPoint(id: string, data: any) {
    return prisma.floorTransitionPoint.update({
      where: { id },
      data,
      include: {
        floor: true,
        connectsToFloor: true,
      },
    });
  },

  async deleteTransitionPoint(id: string) {
    return prisma.floorTransitionPoint.delete({
      where: { id },
    });
  },

  async findTransitionPoints(floorId: string) {
    return prisma.floorTransitionPoint.findMany({
      where: { floorId },
      include: {
        floor: true,
        connectsToFloor: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  },

  async createTranslation(
    floorId: string,
    language: string,
    audience: string,
    name: string
  ) {
    return prisma.floorTranslation.create({
      data: {
        floorId,
        language: language as any,
        audience: audience as any,
        name,
      },
    });
  },

  async findTranslations(floorId: string) {
    return prisma.floorTranslation.findMany({
      where: { floorId },
    });
  },

  async updateTranslation(
    floorId: string,
    language: string,
    audience: string,
    name: string
  ) {
    return prisma.floorTranslation.upsert({
      where: {
        floorId_language_audience: {
          floorId,
          language: language as any,
          audience: audience as any,
        },
      },
      create: {
        floorId,
        language: language as any,
        audience: audience as any,
        name,
      },
      update: { name },
    });
  },

  async deleteTranslation(floorId: string, language: string, audience: string) {
    return prisma.floorTranslation.delete({
      where: {
        floorId_language_audience: {
          floorId,
          language: language as any,
          audience: audience as any,
        },
      },
    });
  },
};
