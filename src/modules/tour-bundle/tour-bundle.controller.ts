import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseParams } from "@/lib/api/validate";
import { z } from "zod";
import { tourBundleService } from "./tour-bundle.service";

const tourIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
});

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const tourBundleController = {
  async getLatest(_req: NextRequest, tourId: string) {
    const bundle = await tourBundleService.getLatest(tourId);
    return success(bundle);
  },

  async getLatestDetail(_req: NextRequest, tourId: string) {
    const bundle = await tourBundleService.getLatestDetail(tourId);
    return success(bundle);
  },

  async build(req: NextRequest, tourId: string, staffAuthUserId: string) {
    const bundle = await tourBundleService.buildForTour(
      tourId,
      getAuditContext(req, staffAuthUserId),
    );
    return success(bundle, { status: 201 });
  },

  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },
};
