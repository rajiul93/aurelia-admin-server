import { NotFoundError } from "@/lib/api/errors";
import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourRouteController } from "@/modules/tour-route";
import { tourRepository } from "@/modules/tour";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId } = tourRouteController.parseTourParams(await context.params);
  const floor = await tourRepository.getFloor1ByTourId(tourId);
  if (!floor) throw new NotFoundError("Tour has no floors");
  return tourRouteController.createEdge(req, tourId, floor.id, staff.id);
});
