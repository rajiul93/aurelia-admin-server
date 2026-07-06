import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { tourBundleController } from "@/modules/tour-bundle";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

/** Full signed package (manifest + content + FTS documents) for staff inspection. */
export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId } = tourBundleController.parseTourParams(await context.params);
  return tourBundleController.getLatestDetail(req, tourId);
});
