import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourRouteController } from "@/modules/tour-route";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId, floorId } = tourRouteController.parseFloorParams(
    await context.params,
  );
  return tourRouteController.getByFloor(req, tourId, floorId);
});

export const PUT = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, floorId } = tourRouteController.parseFloorParams(
    await context.params,
  );
  return tourRouteController.replace(req, tourId, floorId, staff.id);
});
