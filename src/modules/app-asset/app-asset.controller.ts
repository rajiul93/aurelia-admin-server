import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import {
  appAssetIdParamSchema,
  createAppAssetSchema,
  listAppAssetsQuerySchema,
  updateAppAssetSchema,
} from "./app-asset.schema";
import { appAssetService } from "./app-asset.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const appAssetController = {
  async list(req: NextRequest) {
    const query = parseQuery(req.nextUrl.searchParams, listAppAssetsQuerySchema);
    const result = await appAssetService.list(query);
    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest, staffAuthUserId: string) {
    const body = await parseBody(req, createAppAssetSchema);
    const record = await appAssetService.create(
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(record, { status: 201 });
  },

  async getById(id: string) {
    const record = await appAssetService.getById(id);
    return success(record);
  },

  async update(req: NextRequest, id: string, staffAuthUserId: string) {
    const body = await parseBody(req, updateAppAssetSchema);
    const record = await appAssetService.update(
      id,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(record);
  },

  async delete(req: NextRequest, id: string, staffAuthUserId: string) {
    await appAssetService.delete(id, getAuditContext(req, staffAuthUserId));
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, appAssetIdParamSchema).id;
  },
};
