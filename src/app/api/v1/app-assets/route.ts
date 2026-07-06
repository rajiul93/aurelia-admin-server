import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { appAssetController } from "@/modules/app-asset";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return appAssetController.list(req);
});

export const POST = withErrorHandler(async (req) => {
  const staff = await requireStaffSessionFromRequest(req);
  return appAssetController.create(req, staff.id);
});
