import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffRole } from "@/lib/api/require-staff";
import { tourAccessController } from "@/modules/tour-access";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const GET = withErrorHandler(async (_req, context: RouteContext) => {
  await requireStaffRole("ADMIN");
  const id = tourAccessController.parseId(await context.params);
  return tourAccessController.getById(id);
});

export const PATCH = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffRole("ADMIN");
  const id = tourAccessController.parseId(await context.params);
  return tourAccessController.update(req, id, staff.id);
});

export const DELETE = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffRole("ADMIN");
  const id = tourAccessController.parseId(await context.params);
  return tourAccessController.delete(req, id, staff.id);
});
