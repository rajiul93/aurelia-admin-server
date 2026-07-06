import { withErrorHandler } from "@/lib/api/handler";
import { mobileEntitlementsController } from "@/modules/mobile-entitlements";

export const GET = withErrorHandler(async (req) => {
  return mobileEntitlementsController.me(req);
});
