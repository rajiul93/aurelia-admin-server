import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { appUiStringController } from "@/modules/app-ui-string";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return appUiStringController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  const staff = await requireStaffSessionFromRequest(req);
  return appUiStringController.create(req, staff.id);
});
