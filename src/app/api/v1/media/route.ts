import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { mediaController } from "@/modules/media";

export const POST = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  return mediaController.upload(req);
});
