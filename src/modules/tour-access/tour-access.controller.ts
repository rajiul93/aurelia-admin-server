import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import {
  createTourAccessSchema,
  listTourAccessQuerySchema,
  tourAccessIdParamSchema,
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

  async delete(req: NextRequest, id: string, staffAuthUserId: string) {
    await tourAccessService.delete(id, getAuditContext(req, staffAuthUserId));
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourAccessIdParamSchema).id;
  },
};
