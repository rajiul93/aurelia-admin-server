import { withErrorHandler } from "@/lib/api/handler";
import { mobileAuthController } from "@/modules/mobile-auth";

export const GET = withErrorHandler(async (req) => {
  return mobileAuthController.listDevices(req);
});
