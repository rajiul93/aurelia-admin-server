import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type { StaffProfile } from "@/types/media";

export const staffProfileService = {
  getMe() {
    return apiClient
      .get<ApiSuccess<StaffProfile>>("/staff-profile/me")
      .then((response) => response.data);
  },

  updateAvatar(avatarMediaId: string | null) {
    return apiClient
      .patch<ApiSuccess<StaffProfile>>("/staff-profile/me", {
        avatarMediaId,
      })
      .then((response) => response.data);
  },
};
