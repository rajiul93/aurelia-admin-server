import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams } from "@/lib/api/validate";
import {
  createRouteEdgeSchema,
  routeEdgeIdParamSchema,
  replaceTourRouteSchema,
  tourIdParamSchema,
  updateRouteEdgeSchema,
} from "./tour-route.schema";
import { tourRouteService } from "./tour-route.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const tourRouteController = {
  async getByTourId(_req: NextRequest, tourId: string) {
    const route = await tourRouteService.getByTourId(tourId);
    return success(route);
  },

  async replace(req: NextRequest, tourId: string, staffAuthUserId: string) {
    const body = await parseBody(req, replaceTourRouteSchema);
    const route = await tourRouteService.replace(
      tourId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(route);
  },

  async generateFromSpots(
    req: NextRequest,
    tourId: string,
    staffAuthUserId: string,
  ) {
    const route = await tourRouteService.generateFromSpots(
      tourId,
      getAuditContext(req, staffAuthUserId),
    );
    return success(route);
  },

  async generateFootprintsFromOsrm(
    req: NextRequest,
    tourId: string,
    staffAuthUserId: string,
  ) {
    const route = await tourRouteService.generateFootprintsFromOsrm(
      tourId,
      getAuditContext(req, staffAuthUserId),
    );
    return success(route);
  },

  async createEdge(req: NextRequest, tourId: string, staffAuthUserId: string) {
    const body = await parseBody(req, createRouteEdgeSchema);
    const edge = await tourRouteService.createEdge(
      tourId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(edge, { status: 201 });
  },

  async updateEdge(
    req: NextRequest,
    tourId: string,
    edgeId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, updateRouteEdgeSchema);
    const edge = await tourRouteService.updateEdge(
      tourId,
      edgeId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(edge);
  },

  async deleteEdge(
    req: NextRequest,
    tourId: string,
    edgeId: string,
    staffAuthUserId: string,
  ) {
    await tourRouteService.deleteEdge(
      tourId,
      edgeId,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },

  parseEdgeParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, routeEdgeIdParamSchema);
  },
};
