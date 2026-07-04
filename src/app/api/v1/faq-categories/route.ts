import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { faqCategoryController } from "@/modules/faq-category";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return faqCategoryController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return faqCategoryController.create(req);
});
