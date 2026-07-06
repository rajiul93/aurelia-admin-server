import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { isAppLanguage } from "@/lib/i18n/languages";
import { enforceRateLimit } from "@/lib/mobile/rate-limit";
import { requireMobileRequest } from "@/lib/mobile/require-mobile";
import { mobileCatalogService } from "./mobile-catalog.service";

export const mobileCatalogController = {
  async listTours(req: NextRequest) {
    await requireMobileRequest(req);
    enforceRateLimit(req, {
      scope: "catalog-tours",
      limit: 60,
      windowMs: 60 * 1000,
    });

    const languageParam = req.nextUrl.searchParams.get("language");
    const language =
      languageParam && isAppLanguage(languageParam) ? languageParam : undefined;

    const tours = await mobileCatalogService.listPublishedTours(language);
    return success(tours);
  },
};
