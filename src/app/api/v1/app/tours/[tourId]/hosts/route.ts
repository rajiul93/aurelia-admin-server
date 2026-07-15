import { withErrorHandler } from "@/lib/api/handler";
import { mobileHostController } from "@/modules/mobile-host";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  const { tourId } = mobileHostController.parseTourParams(
    await context.params,
  );
  return mobileHostController.list(req, tourId);
});
