import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import {
  appUiStringIdParamSchema,
  createAppUiStringSchema,
  listAppUiStringsQuerySchema,
  updateAppUiStringSchema,
} from "./app-ui-string.schema";
import { appUiStringService } from "./app-ui-string.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const appUiStringController = {
  async list(req: NextRequest) {
    const query = parseQuery(
      req.nextUrl.searchParams,
      listAppUiStringsQuerySchema,
    );
    const result = await appUiStringService.list(query);
    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest, staffAuthUserId: string) {
    const body = await parseBody(req, createAppUiStringSchema);
    const record = await appUiStringService.create(
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(record, { status: 201 });
  },

  async getById(id: string) {
    const record = await appUiStringService.getById(id);
    return success(record);
  },

  async update(req: NextRequest, id: string, staffAuthUserId: string) {
    const body = await parseBody(req, updateAppUiStringSchema);
    const record = await appUiStringService.update(
      id,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(record);
  },

  async delete(req: NextRequest, id: string, staffAuthUserId: string) {
    await appUiStringService.delete(id, getAuditContext(req, staffAuthUserId));
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, appUiStringIdParamSchema).id;
  },
};
