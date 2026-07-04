import type { NextRequest } from "next/server";
import { parseBody } from "@/lib/api/validate";
import { success } from "@/lib/api/response";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { z } from "zod";
import { staffProfileService } from "./staff-profile.service";

const updateStaffProfileSchema = z.object({
  avatarMediaId: z.string().trim().min(1).nullable().optional(),
});

export const staffProfileController = {
  async getMe(_req: NextRequest) {
    const user = await requireStaffSessionFromRequest(_req);
    const profile = await staffProfileService.getOrCreate(user.id);
    return success(profile);
  },

  async updateMe(req: NextRequest) {
    const user = await requireStaffSessionFromRequest(req);
    const body = await parseBody(req, updateStaffProfileSchema);
    const profile = await staffProfileService.updateAvatar(
      user.id,
      body.avatarMediaId ?? null,
    );

    return success(profile);
  },
};
