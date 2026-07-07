import { withErrorHandler } from "@/lib/api/handler";
import { requireMobileRequest } from "@/lib/mobile/require-mobile";
import { subscriptionPurchaseController } from "@/modules/subscription-purchase";

export const GET = withErrorHandler(async (req) => {
  await requireMobileRequest(req);
  return subscriptionPurchaseController.config();
});
