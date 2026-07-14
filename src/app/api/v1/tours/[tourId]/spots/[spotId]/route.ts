import { NotFoundError } from "@/lib/api/errors";
import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { spotController } from "@/modules/spot";
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
  const { tourId, spotId } = spotController.parseSpotParams(await context.params);
  const floor = await getFloor(tourId);
  return spotController.getById(req, tourId, floor.id, spotId);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId } = spotController.parseSpotParams(await context.params);
  const floor = await getFloor(tourId);
  return spotController.update(req, tourId, floor.id, spotId, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId } = spotController.parseSpotParams(await context.params);
  const floor = await getFloor(tourId);
  return spotController.delete(req, tourId, floor.id, spotId, staff.id);
});
