import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourAccessController } from "@/modules/tour-access";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return tourAccessController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  const staff = await requireStaffSessionFromRequest(req);
  return tourAccessController.create(req, staff.id);
});
