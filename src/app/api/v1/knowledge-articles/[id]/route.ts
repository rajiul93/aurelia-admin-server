import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { knowledgeArticleController } from "@/modules/knowledge-article";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = knowledgeArticleController.parseId(await context.params);
  return knowledgeArticleController.getById(req, id);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const id = knowledgeArticleController.parseId(await context.params);
  return knowledgeArticleController.update(req, id, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffSessionFromRequest(req);
  const id = knowledgeArticleController.parseId(await context.params);
  return knowledgeArticleController.delete(req, id, staff.id);
});
