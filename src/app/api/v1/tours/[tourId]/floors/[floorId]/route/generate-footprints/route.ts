import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourRouteController } from "@/modules/tour-route";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, floorId } = tourRouteController.parseFloorParams(
    await context.params,
  );
  return tourRouteController.generateFootprintsFromOsrm(
    req,
    tourId,
    floorId,
    staff.id,
  );
});
