import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { faqController } from "@/modules/faq";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = faqController.parseId(await context.params);
  return faqController.getById(req, id);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = faqController.parseId(await context.params);
  return faqController.update(req, id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const id = faqController.parseId(await context.params);
  return faqController.delete(id);
});
