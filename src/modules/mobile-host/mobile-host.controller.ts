import type { NextRequest } from "next/server";
import { parseParams } from "@/lib/api/validate";
import { success } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/mobile/rate-limit";
import { requireMobileRequest } from "@/lib/mobile/require-mobile";
import { tourIdParamSchema } from "@/modules/host/host.schema";
import { mobileHostService } from "./mobile-host.service";

export const mobileHostController = {
  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },

  async list(req: NextRequest, tourId: string) {
    await requireMobileRequest(req);
    enforceRateLimit(req, {
      scope: "hosts",
      limit: 60,
      windowMs: 60 * 1000,
    });

    const hosts = await mobileHostService.listByTour(tourId);
    return success(hosts);
  },
};
