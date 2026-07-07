import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { knowledgeArticleController } from "@/modules/knowledge-article";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return knowledgeArticleController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  const staff = await requireStaffSessionFromRequest(req);
  return knowledgeArticleController.create(req, staff.id);
});
