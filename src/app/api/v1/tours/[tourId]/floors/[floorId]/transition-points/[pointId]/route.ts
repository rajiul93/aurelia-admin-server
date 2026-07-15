import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { floorController } from "@/modules/floor";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, floorId, pointId } =
    floorController.parseTransitionPointParams(await context.params);
  return floorController.updateTransitionPoint(
    req,
    tourId,
    floorId,
    pointId,
    staff.id,
  );
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, floorId, pointId } =
    floorController.parseTransitionPointParams(await context.params);
  return floorController.deleteTransitionPoint(
    req,
    tourId,
    floorId,
    pointId,
    staff.id,
  );
});
