import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { aiKnowledgeController } from "@/modules/ai-knowledge";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId } = aiKnowledgeController.parseTourParams(
    await context.params,
  );
  return aiKnowledgeController.list(req, tourId);
});

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId } = aiKnowledgeController.parseTourParams(
    await context.params,
  );
  return aiKnowledgeController.create(req, tourId, staff.id);
});
