import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { spotController, spotService } from "@/modules/spot";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId, faqId } = spotController.parseFaqParams(
    await context.params,
  );
  const floorId = await spotService.getFloorIdForSpot(tourId, spotId);
  return spotController.updateFaq(
    req,
    tourId,
    floorId,
    spotId,
    faqId,
    staff.id,
  );
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId, faqId } = spotController.parseFaqParams(
    await context.params,
  );
  const floorId = await spotService.getFloorIdForSpot(tourId, spotId);
  return spotController.deleteFaq(
    req,
    tourId,
    floorId,
    spotId,
    faqId,
    staff.id,
  );
});
