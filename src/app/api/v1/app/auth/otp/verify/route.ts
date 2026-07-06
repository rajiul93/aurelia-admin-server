import { withErrorHandler } from "@/lib/api/handler";
import { mobileAuthController } from "@/modules/mobile-auth";

export const POST = withErrorHandler(async (req) => {
  return mobileAuthController.verifyOtp(req);
});
