import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { devicePricingTierController } from "@/modules/device-pricing-tier";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = devicePricingTierController.parseId(await context.params);
  return devicePricingTierController.getById(id);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const id = devicePricingTierController.parseId(await context.params);
  return devicePricingTierController.update(req, id, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const id = devicePricingTierController.parseId(await context.params);
  return devicePricingTierController.delete(req, id, staff.id);
});
