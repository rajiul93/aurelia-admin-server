import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { floorController } from "@/modules/floor";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId, floorId } = floorController.parseFloorParams(
    await context.params,
  );
  return floorController.listTransitionPoints(req, tourId, floorId);
});

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, floorId } = floorController.parseFloorParams(
    await context.params,
  );
  return floorController.createTransitionPoint(req, tourId, floorId, staff.id);
});
