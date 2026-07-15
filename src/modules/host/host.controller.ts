import type { NextRequest } from "next/server";
import { parseBody, parseParams } from "@/lib/api/validate";
import { success } from "@/lib/api/response";
import { hostService } from "./host.service";
import {
  createHostSchema,
  updateHostSchema,
  tourIdParamSchema,
  hostIdParamSchema,
} from "./host.schema";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const hostController = {
  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },

  parseHostParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, hostIdParamSchema);
  },

  async list(tourId: string) {
    const hosts = await hostService.listByTour(tourId);
    return success(hosts);
  },

  async get(tourId: string, hostId: string) {
    const host = await hostService.getById(tourId, hostId);
    return success(host);
  },

  async create(req: NextRequest, tourId: string, staffAuthUserId: string) {
    const body = await parseBody(req, createHostSchema);
    const host = await hostService.create(
      tourId,
      body,
      getAuditContext(req, staffAuthUserId)
    );
    return success(host, { status: 201 });
  },

  async update(
    req: NextRequest,
    tourId: string,
    hostId: string,
    staffAuthUserId: string
  ) {
    const body = await parseBody(req, updateHostSchema);
    const host = await hostService.update(
      hostId,
      tourId,
      body,
      getAuditContext(req, staffAuthUserId)
    );
    return success(host);
  },

  async delete(
    req: NextRequest,
    tourId: string,
    hostId: string,
    staffAuthUserId: string
  ) {
    await hostService.delete(hostId, tourId, getAuditContext(req, staffAuthUserId));
    return success(null);
  },
};
