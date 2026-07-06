import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseParams } from "@/lib/api/validate";
import { enforceRateLimit, getRateLimitIdentity } from "@/lib/mobile/rate-limit";
import { requireMobileSession } from "@/lib/mobile/require-mobile";
import { z } from "zod";
import { mobileDownloadService } from "./mobile-download.service";

const tourIdParamSchema = z.object({
  tourId: z.string().trim().min(1),
});

export const mobileDownloadController = {
  async download(req: NextRequest, tourId: string) {
    const session = await requireMobileSession(req);
    enforceRateLimit(req, {
      scope: "tour-download",
      limit: 20,
      windowMs: 60 * 60 * 1000,
      identity: getRateLimitIdentity(req, session.deviceId),
    });

    const bundle = await mobileDownloadService.getSignedBundle(session, tourId);
    return success(bundle);
  },

  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },
};
