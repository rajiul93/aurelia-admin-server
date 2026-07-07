import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { subscriptionPlanController } from "@/modules/subscription-plan";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = subscriptionPlanController.parseId(await context.params);
  return subscriptionPlanController.getById(id);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const id = subscriptionPlanController.parseId(await context.params);
  return subscriptionPlanController.update(req, id, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const id = subscriptionPlanController.parseId(await context.params);
  return subscriptionPlanController.delete(req, id, staff.id);
});
