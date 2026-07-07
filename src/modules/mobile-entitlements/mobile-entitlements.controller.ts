import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { requireMobileIdentity } from "@/lib/mobile/require-mobile";
import { mobileEntitlementsService } from "./mobile-entitlements.service";

export const mobileEntitlementsController = {
  async me(req: NextRequest) {
    const session = await requireMobileIdentity(req);
    const entitlements = await mobileEntitlementsService.getForSession(session);
    return success(entitlements);
  },
};
