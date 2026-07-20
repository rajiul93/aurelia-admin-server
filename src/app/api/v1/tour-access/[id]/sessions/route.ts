import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffRole } from "@/lib/api/require-staff";
import { tourAccessController } from "@/modules/tour-access";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (_req, context: RouteContext) => {
  await requireStaffRole("ADMIN");
  const id = tourAccessController.parseId(await context.params);
  return tourAccessController.listDeviceSessions(id);
});
