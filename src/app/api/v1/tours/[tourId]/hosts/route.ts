import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { hostController } from "@/modules/host";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId } = hostController.parseTourParams(await context.params);
  return hostController.list(tourId);
});

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId } = hostController.parseTourParams(await context.params);
  return hostController.create(req, tourId, staff.id);
});
