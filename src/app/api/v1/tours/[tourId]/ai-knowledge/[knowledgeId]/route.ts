import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { aiKnowledgeController } from "@/modules/ai-knowledge";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const { tourId, knowledgeId } = aiKnowledgeController.parseKnowledgeParams(
    await context.params,
  );
  return aiKnowledgeController.getById(req, tourId, knowledgeId);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, knowledgeId } = aiKnowledgeController.parseKnowledgeParams(
    await context.params,
  );
  return aiKnowledgeController.update(req, tourId, knowledgeId, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const { tourId, knowledgeId } = aiKnowledgeController.parseKnowledgeParams(
    await context.params,
  );
  return aiKnowledgeController.delete(req, tourId, knowledgeId, staff.id);
});
