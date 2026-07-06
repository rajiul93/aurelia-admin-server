import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { DEFAULT_LANGUAGE, isAppLanguage } from "@/lib/i18n/languages";
import { enforceRateLimit } from "@/lib/mobile/rate-limit";
import { requireMobileRequest } from "@/lib/mobile/require-mobile";
import { mobileAppContentService } from "./mobile-app-content.service";

export const mobileAppContentController = {
  async get(req: NextRequest) {
    await requireMobileRequest(req);
    enforceRateLimit(req, {
      scope: "app-content",
      limit: 60,
      windowMs: 60 * 1000,
    });

    const languageParam = req.nextUrl.searchParams.get("language");
    const language =
      languageParam && isAppLanguage(languageParam)
        ? languageParam
        : DEFAULT_LANGUAGE;

    const bundle = await mobileAppContentService.getBundle(language);
    return success(bundle);
  },
};
