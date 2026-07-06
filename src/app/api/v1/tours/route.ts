import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourController } from "@/modules/tour";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return tourController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  const staff = await requireStaffSessionFromRequest(req);
  return tourController.create(req, staff.id);
});
