import { withErrorHandler } from "@/lib/api/handler";
import { mobileReleaseConfigController } from "@/modules/mobile-release-config";

export const GET = withErrorHandler(async (req) => {
  return mobileReleaseConfigController.get(req);
});
