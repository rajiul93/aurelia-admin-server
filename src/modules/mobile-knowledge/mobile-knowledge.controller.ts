import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/mobile/rate-limit";
import { requireMobileRequest } from "@/lib/mobile/require-mobile";
import { mobileKnowledgeService } from "./mobile-knowledge.service";

export const mobileKnowledgeController = {
  async getPack(req: NextRequest) {
    await requireMobileRequest(req);
    enforceRateLimit(req, {
      scope: "knowledge-pack",
      limit: 30,
      windowMs: 60 * 1000,
    });

    const pack = await mobileKnowledgeService.getPack();
    return success(pack);
  },
};
