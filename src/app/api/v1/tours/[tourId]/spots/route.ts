import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { spotController } from "@/modules/spot";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId } = spotController.parseTourParams(await context.params);
  return spotController.list(req, tourId);
});

// The floor comes from the body (floorId); omitting it puts the spot on the
// tour's lowest floor.
export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId } = spotController.parseTourParams(await context.params);
  return spotController.create(req, tourId, staff.id);
});
