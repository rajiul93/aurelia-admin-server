import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import {
  createTourAccessSchema,
  listTourAccessQuerySchema,
  tourAccessAnalyticsQuerySchema,
  tourAccessIdParamSchema,
  tourAccessSessionParamSchema,
  updateTourAccessSchema,
} from "./tour-access.schema";
import { tourAccessService } from "./tour-access.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const tourAccessController = {
  async list(req: NextRequest) {
    const query = parseQuery(req.nextUrl.searchParams, listTourAccessQuerySchema);
    const result = await tourAccessService.list(query);

    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest, staffAuthUserId: string) {
    const body = await parseBody(req, createTourAccessSchema);
    const access = await tourAccessService.create(
      body,
      staffAuthUserId,
      getAuditContext(req, staffAuthUserId),
    );

    return success(access, { status: 201 });
  },

  async getById(id: string) {
    const access = await tourAccessService.getById(id);
    return success(access);
  },

  async update(req: NextRequest, id: string, staffAuthUserId: string) {
    const body = await parseBody(req, updateTourAccessSchema);
    const access = await tourAccessService.update(
      id,
      body,
      getAuditContext(req, staffAuthUserId),
    );

    return success(access);
  },

  async revoke(req: NextRequest, id: string, staffAuthUserId: string) {
    const access = await tourAccessService.revoke(
      id,
      getAuditContext(req, staffAuthUserId),
    );

    return success(access);
  },

  async listDeviceSessions(id: string) {
    const sessions = await tourAccessService.listDeviceSessions(id);
    return success(sessions);
  },

  async revokeDeviceSession(
    req: NextRequest,
    accessId: string,
    sessionId: string,
    staffAuthUserId: string,
  ) {
    const result = await tourAccessService.revokeDeviceSession(
      accessId,
      sessionId,
      getAuditContext(req, staffAuthUserId),
    );

    return success(result);
  },

  async delete(req: NextRequest, id: string, staffAuthUserId: string) {
    await tourAccessService.delete(id, getAuditContext(req, staffAuthUserId));
    return success({ deleted: true });
  },

  async getAnalyticsSeries(req: NextRequest) {
    const query = parseQuery(req.nextUrl.searchParams, tourAccessAnalyticsQuerySchema);
    const result = await tourAccessService.getAnalyticsSeries(query);
    return success(result);
  },

  async getAnalyticsSummary() {
    const result = await tourAccessService.getAnalyticsSummary();
    return success(result);
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourAccessIdParamSchema).id;
  },

  parseSessionParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourAccessSessionParamSchema);
  },
};
