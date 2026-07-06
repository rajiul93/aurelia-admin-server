import { withErrorHandler } from "@/lib/api/handler";
import { mobileVersionsController } from "@/modules/mobile-versions";

export const GET = withErrorHandler(async (req) => {
  return mobileVersionsController.get(req);
});
