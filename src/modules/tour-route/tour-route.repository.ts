import type { Prisma } from "@/generated/prisma/client";
import { Prisma as PrismaRuntime } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { FootprintPoint } from "./tour-route.types";

const spotSummaryInclude = {
  translations: {
    orderBy: { language: "asc" as const },
  },
} satisfies Prisma.SpotInclude;

const edgeInclude = {
  fromSpot: { include: spotSummaryInclude },
  toSpot: { include: spotSummaryInclude },
} satisfies Prisma.RouteEdgeInclude;

const routeInclude = {
  edges: {
    orderBy: { sortOrder: "asc" as const },
    include: edgeInclude,
  },
} satisfies Prisma.TourRouteInclude;

function toFootprintJson(
  footprintGeo: FootprintPoint[] | null | undefined,
): Prisma.InputJsonValue | typeof PrismaRuntime.JsonNull | undefined {
  if (footprintGeo === undefined) {
    return undefined;
  }

  if (footprintGeo === null) {
    return PrismaRuntime.JsonNull;
  }

  return footprintGeo;
}

export const tourRouteRepository = {
  findByTourId(tourId: string) {
    return prisma.tourRoute.findUnique({
      where: { tourId },
      include: routeInclude,
    });
  },

  findEdgeById(tourId: string, edgeId: string) {
    return prisma.routeEdge.findFirst({
      where: {
        id: edgeId,
        route: { tourId },
      },
      include: edgeInclude,
    });
  },

  upsertRoute(tourId: string) {
    return prisma.tourRoute.upsert({
      where: { tourId },
      create: { tourId },
      update: {},
      include: routeInclude,
    });
  },

  replaceEdges(
    tourId: string,
    edges: Array<{
      fromSpotId: string;
      toSpotId: string;
      sortOrder: number;
      footprintGeo?: FootprintPoint[] | null;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      const route = await tx.tourRoute.upsert({
        where: { tourId },
        create: { tourId },
        update: {},
      });

      await tx.routeEdge.deleteMany({ where: { routeId: route.id } });

      if (edges.length > 0) {
        await tx.routeEdge.createMany({
          data: edges.map((edge) => ({
            routeId: route.id,
            fromSpotId: edge.fromSpotId,
            toSpotId: edge.toSpotId,
            sortOrder: edge.sortOrder,
            footprintGeo:
              edge.footprintGeo === undefined || edge.footprintGeo === null
                ? PrismaRuntime.JsonNull
                : edge.footprintGeo,
          })),
        });
      }

      await tx.tour.update({
        where: { id: tourId },
        data: { routeVersion: { increment: 1 } },
      });

      return tx.tourRoute.findUniqueOrThrow({
        where: { id: route.id },
        include: routeInclude,
      });
    });
  },

  createEdge(
    routeId: string,
    tourId: string,
    data: {
      fromSpotId: string;
      toSpotId: string;
      sortOrder: number;
      footprintGeo?: FootprintPoint[] | null;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const footprintGeo = toFootprintJson(data.footprintGeo);

      const edge = await tx.routeEdge.create({
        data: {
          routeId,
          fromSpotId: data.fromSpotId,
          toSpotId: data.toSpotId,
          sortOrder: data.sortOrder,
          ...(footprintGeo !== undefined ? { footprintGeo } : {}),
        },
        include: edgeInclude,
      });

      await tx.tour.update({
        where: { id: tourId },
        data: { routeVersion: { increment: 1 } },
      });

      return edge;
    });
  },

  updateEdge(
    edgeId: string,
    tourId: string,
    data: {
      fromSpotId?: string;
      toSpotId?: string;
      sortOrder?: number;
      footprintGeo?: FootprintPoint[] | null;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const footprintGeo = toFootprintJson(data.footprintGeo);

      const edge = await tx.routeEdge.update({
        where: { id: edgeId },
        data: {
          ...(data.fromSpotId !== undefined
            ? { fromSpot: { connect: { id: data.fromSpotId } } }
            : {}),
          ...(data.toSpotId !== undefined
            ? { toSpot: { connect: { id: data.toSpotId } } }
            : {}),
          ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
          ...(footprintGeo !== undefined ? { footprintGeo } : {}),
        },
        include: edgeInclude,
      });

      await tx.tour.update({
        where: { id: tourId },
        data: { routeVersion: { increment: 1 } },
      });

      return edge;
    });
  },

  deleteEdge(edgeId: string, tourId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.routeEdge.delete({ where: { id: edgeId } });
      await tx.tour.update({
        where: { id: tourId },
        data: { routeVersion: { increment: 1 } },
      });
    });
  },
};
