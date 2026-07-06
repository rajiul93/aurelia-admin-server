import { withErrorHandler } from "@/lib/api/handler";
import { mobileCatalogController } from "@/modules/mobile-catalog";

export const GET = withErrorHandler(async (req) => {
  return mobileCatalogController.listTours(req);
});
