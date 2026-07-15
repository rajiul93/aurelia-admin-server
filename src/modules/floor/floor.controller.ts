import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams } from "@/lib/api/validate";
import {
  createFloorSchema,
  createTransitionPointSchema,
  floorIdParamSchema,
  tourIdParamSchema,
  transitionPointIdParamSchema,
  updateFloorSchema,
  updateTransitionPointSchema,
} from "./floor.schema";
import { floorService } from "./floor.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const floorController = {
  async list(_req: NextRequest, tourId: string) {
    const floors = await floorService.listByTour(tourId);
    return success(floors);
  },

  async create(req: NextRequest, tourId: string, staffAuthUserId: string) {
    const body = await parseBody(req, createFloorSchema);
    const floor = await floorService.create(
      tourId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(floor, { status: 201 });
  },

  async getById(_req: NextRequest, tourId: string, floorId: string) {
    const floor = await floorService.getById(tourId, floorId);
    return success(floor);
  },

  async update(
    req: NextRequest,
    tourId: string,
    floorId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, updateFloorSchema);
    const floor = await floorService.update(
      tourId,
      floorId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(floor);
  },

  async delete(
    req: NextRequest,
    tourId: string,
    floorId: string,
    staffAuthUserId: string,
  ) {
    await floorService.delete(
      tourId,
      floorId,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  async listTransitionPoints(
    _req: NextRequest,
    tourId: string,
    floorId: string,
  ) {
    const points = await floorService.listTransitionPoints(tourId, floorId);
    return success(points);
  },

  async createTransitionPoint(
    req: NextRequest,
    tourId: string,
    floorId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, createTransitionPointSchema);
    const point = await floorService.createTransitionPoint(
      tourId,
      floorId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(point, { status: 201 });
  },

  async updateTransitionPoint(
    req: NextRequest,
    tourId: string,
    floorId: string,
    pointId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, updateTransitionPointSchema);
    const point = await floorService.updateTransitionPoint(
      tourId,
      floorId,
      pointId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(point);
  },

  async deleteTransitionPoint(
    req: NextRequest,
    tourId: string,
    floorId: string,
    pointId: string,
    staffAuthUserId: string,
  ) {
    await floorService.deleteTransitionPoint(
      tourId,
      floorId,
      pointId,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },

  parseFloorParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, floorIdParamSchema);
  },

  parseTransitionPointParams(
    params: Record<string, string | string[] | undefined>,
  ) {
    return parseParams(params, transitionPointIdParamSchema);
  },
};
