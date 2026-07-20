import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { userController } from "@/modules/user";

export const GET = withErrorHandler(async (req, { params }) => {
  await requireStaffSessionFromRequest(req);
  const id = userController.parseId(await params);
  return userController.getById(req, id);
});

export const PATCH = withErrorHandler(async (req, { params }) => {
  await requireStaffSessionFromRequest(req);
  const id = userController.parseId(await params);
  return userController.update(req, id);
});

export const DELETE = withErrorHandler(async (req, { params }) => {
  await requireStaffSessionFromRequest(req);
  const id = userController.parseId(await params);
  return userController.delete(req, id);
});
