import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourController } from "@/modules/tour";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const tourId = tourController.parseId(await context.params);
  return tourController.getReadiness(req, tourId);
});

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const tourId = tourController.parseId(await context.params);
  return tourController.transition(req, tourId, staff.id);
});
