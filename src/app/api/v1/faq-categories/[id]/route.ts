import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { faqCategoryController } from "@/modules/faq-category";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = faqCategoryController.parseId(await context.params);
  return faqCategoryController.getById(req, id);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = faqCategoryController.parseId(await context.params);
  return faqCategoryController.update(req, id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = faqCategoryController.parseId(await context.params);
  return faqCategoryController.delete(id);
});
