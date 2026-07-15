import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { spotController, spotService } from "@/modules/spot";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId } = spotController.parseSpotParams(
    await context.params,
  );
  const floorId = await spotService.getFloorIdForSpot(tourId, spotId);
  return spotController.createMedia(req, tourId, floorId, spotId, staff.id);
});
