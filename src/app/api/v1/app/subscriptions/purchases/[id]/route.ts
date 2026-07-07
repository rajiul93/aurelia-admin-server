import { withErrorHandler } from "@/lib/api/handler";
import { requireMobileIdentity } from "@/lib/mobile/require-mobile";
import { subscriptionPurchaseController } from "@/modules/subscription-purchase";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  const session = await requireMobileIdentity(req);
  const id = subscriptionPurchaseController.parseId(await context.params);
  return subscriptionPurchaseController.status(id, session);
});
