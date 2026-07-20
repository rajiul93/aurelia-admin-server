import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffRole } from "@/lib/api/require-staff";
import { tourAccessController } from "@/modules/tour-access";

export const GET = withErrorHandler(async (req) => {
  await requireStaffRole("ADMIN");
  return tourAccessController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  const staff = await requireStaffRole("ADMIN");
  return tourAccessController.create(req, staff.id);
});
