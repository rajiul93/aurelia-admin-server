import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffRole } from "@/lib/api/require-staff";
import { tourAccessController } from "@/modules/tour-access";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

export const POST = withErrorHandler(async (req, context: RouteContext) => {
  const staff = await requireStaffRole("ADMIN");
  const { id, sessionId } = tourAccessController.parseSessionParams(
    await context.params,
  );
  return tourAccessController.revokeDeviceSession(
    req,
    id,
    sessionId,
    staff.id,
  );
});
