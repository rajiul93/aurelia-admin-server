import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { subscriptionPlanController } from "@/modules/subscription-plan";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return subscriptionPlanController.list();
});

export const POST = withErrorHandler(async (req) => {
  const staff = await requireStaffSessionFromRequest(req);
  return subscriptionPlanController.create(req, staff.id);
});
