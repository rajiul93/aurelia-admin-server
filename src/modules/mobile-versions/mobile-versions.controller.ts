import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/mobile/rate-limit";
import {
  requireMobileRequest,
  requireMobileSession,
} from "@/lib/mobile/require-mobile";
import { mobileVersionsService } from "./mobile-versions.service";

export const mobileVersionsController = {
  async get(req: NextRequest) {
    await requireMobileRequest(req);
    enforceRateLimit(req, {
      scope: "versions",
      limit: 120,
      windowMs: 60 * 1000,
    });

    const authorization = req.headers.get("authorization");
    const sessionToken = req.headers.get("x-session-token");

    if (authorization || sessionToken) {
      const session = await requireMobileSession(req);
      const versions = await mobileVersionsService.getEntitledVersions(session);
      return success(versions);
    }

    const versions = await mobileVersionsService.getPublicVersions();
    return success(versions);
  },
};
