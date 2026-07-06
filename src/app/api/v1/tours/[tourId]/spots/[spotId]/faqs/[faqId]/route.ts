import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { spotController } from "@/modules/spot";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId, faqId } = spotController.parseFaqParams(
    await context.params,
  );
  return spotController.updateFaq(req, tourId, spotId, faqId, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, spotId, faqId } = spotController.parseFaqParams(
    await context.params,
  );
  return spotController.deleteFaq(req, tourId, spotId, faqId, staff.id);
});
