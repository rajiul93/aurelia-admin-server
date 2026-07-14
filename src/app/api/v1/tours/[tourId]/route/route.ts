import { NotFoundError } from "@/lib/api/errors";
import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourRouteController } from "@/modules/tour-route";
import { tourRepository } from "@/modules/tour";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

async function getFloor(tourId: string) {
  const floor = await tourRepository.getFloor1ByTourId(tourId);
  if (!floor) throw new NotFoundError("Tour has no floors");
  return floor;
}

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId } = tourRouteController.parseTourParams(await context.params);
  const floor = await getFloor(tourId);
  return tourRouteController.getByTourId(req, tourId, floor.id);
});

export const PUT = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId } = tourRouteController.parseTourParams(await context.params);
  const floor = await getFloor(tourId);
  return tourRouteController.replace(req, tourId, floor.id, staff.id);
});
