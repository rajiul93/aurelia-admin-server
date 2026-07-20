import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { userController } from "@/modules/user";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return userController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return userController.create(req);
});
