import { withErrorHandler } from "@/lib/api/handler";
import { mobileDownloadController } from "@/modules/mobile-download";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const { tourId } = mobileDownloadController.parseTourParams(
    await context.params,
  );
  return mobileDownloadController.download(req, tourId);
});
