import { withErrorHandler } from "@/lib/api/handler";
import { subscriptionPurchaseController } from "@/modules/subscription-purchase";

export const POST = withErrorHandler(async (req) => {
  return subscriptionPurchaseController.webhook(req);
});
