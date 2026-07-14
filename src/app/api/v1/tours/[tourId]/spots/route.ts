import { NotFoundError } from "@/lib/api/errors";
import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { spotController } from "@/modules/spot";
import { tourRepository } from "@/modules/tour";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId } = spotController.parseTourParams(await context.params);
  const floor = await tourRepository.getFloor1ByTourId(tourId);
  if (!floor) throw new NotFoundError("Tour has no floors");
  return spotController.list(req, tourId);
});

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId } = spotController.parseTourParams(await context.params);
  const floor = await tourRepository.getFloor1ByTourId(tourId);
  if (!floor) throw new NotFoundError("Tour has no floors");
  return spotController.create(req, tourId, floor.id, staff.id);
});
