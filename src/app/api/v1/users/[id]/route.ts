import { withErrorHandler } from "@/lib/api/handler";
import { userController } from "@/modules/user";

export const GET = withErrorHandler(async (_req, { params }) => {
  const id = userController.parseId(await params);
  return userController.getById(id);
});

export const PATCH = withErrorHandler(async (req, { params }) => {
  const id = userController.parseId(await params);
  return userController.update(req, id);
});

export const DELETE = withErrorHandler(async (_req, { params }) => {
  const id = userController.parseId(await params);
  return userController.delete(id);
});
