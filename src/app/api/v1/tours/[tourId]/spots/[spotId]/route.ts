import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { spotController } from "@/modules/spot";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId, spotId } = spotController.parseSpotParams(await context.params);
  return spotController.getById(req, tourId, spotId);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId } = spotController.parseSpotParams(await context.params);
  return spotController.update(req, tourId, spotId, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId } = spotController.parseSpotParams(await context.params);
  return spotController.delete(req, tourId, spotId, staff.id);
});
