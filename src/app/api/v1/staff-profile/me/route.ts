import { withErrorHandler } from "@/lib/api/handler";
import { staffProfileController } from "@/modules/staff-profile";

export const GET = withErrorHandler((req) => staffProfileController.getMe(req));
export const PATCH = withErrorHandler((req) =>
  staffProfileController.updateMe(req),
);
