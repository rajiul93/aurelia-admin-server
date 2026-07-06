import { withErrorHandler } from "@/lib/api/handler";
import { mobileAppContentController } from "@/modules/mobile-app-content";

export const GET = withErrorHandler(async (req) => {
  return mobileAppContentController.get(req);
});
