import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { spotController } from "@/modules/spot";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId, mediaId } = spotController.parseMediaParams(
    await context.params,
  );
  return spotController.deleteMedia(req, tourId, spotId, mediaId, staff.id);
});
