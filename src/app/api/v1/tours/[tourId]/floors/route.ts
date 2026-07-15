import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { floorController } from "@/modules/floor";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId } = floorController.parseTourParams(await context.params);
  return floorController.list(req, tourId);
});

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId } = floorController.parseTourParams(await context.params);
  return floorController.create(req, tourId, staff.id);
});
