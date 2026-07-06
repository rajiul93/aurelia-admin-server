import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import { isAppLanguage, type AppLanguage } from "@/lib/i18n/languages";
import {
  createTourSchema,
  listToursQuerySchema,
  tourIdParamSchema,
  tourLifecycleActionSchema,
  updateTourSchema,
} from "./tour.schema";
import { tourService } from "./tour.service";

function parseLanguage(req: NextRequest): AppLanguage | undefined {
  const language = req.nextUrl.searchParams.get("language");
  if (!language) {
    return undefined;
  }

  if (!isAppLanguage(language)) {
    return undefined;
  }

  return language;
}

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const tourController = {
  async list(req: NextRequest) {
    const query = parseQuery(req.nextUrl.searchParams, listToursQuerySchema);
    const result = await tourService.list(query);

    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest, staffAuthUserId: string) {
    const body = await parseBody(req, createTourSchema);
    const tour = await tourService.create(body, getAuditContext(req, staffAuthUserId));

    return success(tour, { status: 201 });
  },

  async getById(req: NextRequest, id: string) {
    const tour = await tourService.getById(id, parseLanguage(req));
    return success(tour);
  },

  async update(req: NextRequest, id: string, staffAuthUserId: string) {
    const body = await parseBody(req, updateTourSchema);
    const tour = await tourService.update(
      id,
      body,
      getAuditContext(req, staffAuthUserId),
    );

    return success(tour);
  },

  async delete(req: NextRequest, id: string, staffAuthUserId: string) {
    await tourService.delete(id, getAuditContext(req, staffAuthUserId));
    return success({ deleted: true });
  },

  async getReadiness(_req: NextRequest, id: string) {
    const readiness = await tourService.getReadiness(id);
    return success(readiness);
  },

  async transition(req: NextRequest, id: string, staffAuthUserId: string) {
    const body = await parseBody(req, tourLifecycleActionSchema);
    const tour = await tourService.transition(
      id,
      body.action,
      getAuditContext(req, staffAuthUserId),
    );
    return success(tour);
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema).tourId;
  },
};
