import type { NextRequest } from "next/server";
import { parseBody, parseParams } from "@/lib/api/validate";
import { success } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/mobile/rate-limit";
import { requireMobileRequest } from "@/lib/mobile/require-mobile";
import { tourIdParamSchema, hostIdParamSchema } from "@/modules/host/host.schema";
import { requestDirectionsSchema } from "./host-directions.schema";
import { hostDirectionsService } from "./host-directions.service";

export const hostDirectionsController = {
  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },

  parseHostParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, hostIdParamSchema);
  },

  async getDirections(req: NextRequest, tourId: string, hostId: string) {
    await requireMobileRequest(req);
    enforceRateLimit(req, {
      scope: "host-directions",
      limit: 15,
      windowMs: 60 * 1000,
    });

    const body = await parseBody(req, requestDirectionsSchema);
    const directions = await hostDirectionsService.getDirections(
      tourId,
      hostId,
      body
    );
    return success(directions);
  },
};
