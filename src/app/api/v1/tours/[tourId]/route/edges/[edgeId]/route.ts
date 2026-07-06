import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourRouteController } from "@/modules/tour-route";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, edgeId } = tourRouteController.parseEdgeParams(
    await context.params,
  );
  return tourRouteController.updateEdge(req, tourId, edgeId, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, edgeId } = tourRouteController.parseEdgeParams(
    await context.params,
  );
  return tourRouteController.deleteEdge(req, tourId, edgeId, staff.id);
});
