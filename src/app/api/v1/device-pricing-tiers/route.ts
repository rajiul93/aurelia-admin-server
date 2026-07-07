import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { devicePricingTierController } from "@/modules/device-pricing-tier";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return devicePricingTierController.list();
});

export const POST = withErrorHandler(async (req) => {
  const staff = await requireStaffSessionFromRequest(req);
  return devicePricingTierController.create(req, staff.id);
});
