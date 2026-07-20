import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffRole } from "@/lib/api/require-staff";
import { tourAccessController } from "@/modules/tour-access";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffRole("ADMIN");
  const id = tourAccessController.parseId(await context.params);
  return tourAccessController.revoke(req, id, staff.id);
});
