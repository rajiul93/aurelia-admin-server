import { withErrorHandler } from "@/lib/api/handler";
import { mobileKnowledgeController } from "@/modules/mobile-knowledge";

export const GET = withErrorHandler(async (req) => {
  return mobileKnowledgeController.getPack(req);
});
