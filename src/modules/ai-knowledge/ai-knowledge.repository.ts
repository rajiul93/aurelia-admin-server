import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const includeRelations = {
  translations: {
    orderBy: { language: "asc" as const },
  },
  spot: {
    include: {
      translations: {
        orderBy: { language: "asc" as const },
      },
    },
  },
} satisfies Prisma.AiKnowledgeInclude;

export const aiKnowledgeRepository = {
  findByTourId(tourId: string) {
    return prisma.aiKnowledge.findMany({
      where: { tourId },
      include: includeRelations,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  },

  findById(tourId: string, knowledgeId: string) {
    return prisma.aiKnowledge.findFirst({
      where: { id: knowledgeId, tourId },
      include: includeRelations,
    });
  },

  create(tourId: string, data: Prisma.AiKnowledgeCreateWithoutTourInput) {
    return prisma.$transaction(async (tx) => {
      const knowledge = await tx.aiKnowledge.create({
        data: {
          tour: { connect: { id: tourId } },
          ...data,
        },
        include: includeRelations,
      });

      await tx.tour.update({
        where: { id: tourId },
        data: { aiKnowledgeVersion: { increment: 1 } },
      });

      return knowledge;
    });
  },

  update(
    tourId: string,
    knowledgeId: string,
    data: Prisma.AiKnowledgeUpdateInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const knowledge = await tx.aiKnowledge.update({
        where: { id: knowledgeId },
        data,
        include: includeRelations,
      });

      await tx.tour.update({
        where: { id: tourId },
        data: { aiKnowledgeVersion: { increment: 1 } },
      });

      return knowledge;
    });
  },

  delete(tourId: string, knowledgeId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.aiKnowledge.delete({ where: { id: knowledgeId } });
      await tx.tour.update({
        where: { id: tourId },
        data: { aiKnowledgeVersion: { increment: 1 } },
      });
    });
  },
};
