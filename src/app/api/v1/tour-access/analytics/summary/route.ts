import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffRole } from "@/lib/api/require-staff";
import { tourAccessController } from "@/modules/tour-access";

export const GET = withErrorHandler(async () => {
  await requireStaffRole("ADMIN");
  return tourAccessController.getAnalyticsSummary();
});
