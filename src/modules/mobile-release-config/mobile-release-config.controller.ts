import type { NextRequest } from "next/server";

import { success } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/mobile/rate-limit";
import { requireMobileRequest } from "@/lib/mobile/require-mobile";

import { mobileReleaseConfigService } from "./mobile-release-config.service";

export const mobileReleaseConfigController = {
  async get(req: NextRequest) {
    await requireMobileRequest(req);
    enforceRateLimit(req, {
      scope: "release-config",
      limit: 120,
      windowMs: 60 * 1000,
    });

    const config = await mobileReleaseConfigService.getPublishedConfig();
    return success(config);
  },
};
