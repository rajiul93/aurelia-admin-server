import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { subscriptionPurchaseController } from "@/modules/subscription-purchase";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return subscriptionPurchaseController.listForAdmin(req);
});
