import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourAccessController } from "@/modules/tour-access";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = tourAccessController.parseId(await context.params);
  return tourAccessController.listDeviceSessions(id);
});
