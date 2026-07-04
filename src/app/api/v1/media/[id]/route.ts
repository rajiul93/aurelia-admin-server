import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { mediaController } from "@/modules/media";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const params = await context.params;
  const id = mediaController.parseId(params);
  return mediaController.getById(id);
});

export const PUT = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const params = await context.params;
  const id = mediaController.parseId(params);
  return mediaController.replace(req, id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  await requireStaffSessionFromRequest(req);
  const params = await context.params;
  const id = mediaController.parseId(params);
  return mediaController.delete(id);
});
