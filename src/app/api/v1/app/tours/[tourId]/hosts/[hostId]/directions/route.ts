import { withErrorHandler } from "@/lib/api/handler";
import { hostDirectionsController } from "@/modules/host-directions";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const params = await context.params;
  const { tourId } = hostDirectionsController.parseTourParams(params);
  const { hostId } = hostDirectionsController.parseHostParams(params);
  return hostDirectionsController.getDirections(req, tourId, hostId);
});
