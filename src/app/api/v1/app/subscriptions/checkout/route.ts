import { withErrorHandler } from "@/lib/api/handler";
import { requireMobileIdentity } from "@/lib/mobile/require-mobile";
import { subscriptionPurchaseController } from "@/modules/subscription-purchase";

export const POST = withErrorHandler(async (req) => {
  const session = await requireMobileIdentity(req);
  return subscriptionPurchaseController.checkout(req, session);
});
