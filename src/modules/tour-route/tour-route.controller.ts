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
  async getByTourId(_req: NextRequest, _tourId: string, floorId: string) {
    const route = await tourRouteService.getByFloorId(floorId);
    return success(route);
  },

  async replace(req: NextRequest, _tourId: string, floorId: string, staffAuthUserId: string) {
    const body = await parseBody(req, replaceTourRouteSchema);
    const route = await tourRouteService.replaceByFloor(
      floorId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(route);
  },

  async generateFromSpots(
    req: NextRequest,
    _tourId: string,
    floorId: string,
    staffAuthUserId: string,
  ) {
    const route = await tourRouteService.generateFromSpotsInFloor(
      floorId,
      getAuditContext(req, staffAuthUserId),
    );
    return success(route);
  },

  async generateFootprintsFromOsrm(
    req: NextRequest,
    _tourId: string,
    floorId: string,
    staffAuthUserId: string,
  ) {
    const route = await tourRouteService.generateFootprintsFromOsrmInFloor(
      floorId,
      getAuditContext(req, staffAuthUserId),
    );
    return success(route);
  },

  async createEdge(req: NextRequest, _tourId: string, floorId: string, staffAuthUserId: string) {
    const body = await parseBody(req, createRouteEdgeSchema);
    const edge = await tourRouteService.createEdgeInFloor(
      floorId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(edge, { status: 201 });
  },

  async updateEdge(
    req: NextRequest,
    _tourId: string,
    floorId: string,
    edgeId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, updateRouteEdgeSchema);
    const edge = await tourRouteService.updateEdgeInFloor(
      floorId,
      edgeId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(edge);
  },

  async deleteEdge(
    req: NextRequest,
    _tourId: string,
    floorId: string,
    edgeId: string,
    staffAuthUserId: string,
  ) {
    await tourRouteService.deleteEdgeInFloor(
      floorId,
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
