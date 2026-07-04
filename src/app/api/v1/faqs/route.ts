import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { faqController } from "@/modules/faq";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return faqController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return faqController.create(req);
});
