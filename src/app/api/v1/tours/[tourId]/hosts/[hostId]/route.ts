import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { hostController } from "@/modules/host";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const params = await context.params;
  const { tourId } = hostController.parseTourParams(params);
  const { hostId } = hostController.parseHostParams(params);
  return hostController.get(tourId, hostId);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const params = await context.params;
  const { tourId } = hostController.parseTourParams(params);
  const { hostId } = hostController.parseHostParams(params);
  return hostController.update(req, tourId, hostId, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const params = await context.params;
  const { tourId } = hostController.parseTourParams(params);
  const { hostId } = hostController.parseHostParams(params);
  return hostController.delete(req, tourId, hostId, staff.id);
});
