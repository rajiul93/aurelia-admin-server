import { mediaService } from "@/modules/media";
import { toStaffProfileDto } from "./staff-profile.mapper";
import { staffProfileRepository } from "./staff-profile.repository";

export const staffProfileService = {
  async getOrCreate(authUserId: string) {
    const existing = await staffProfileRepository.findByAuthUserId(authUserId);

    if (existing) {
      return toStaffProfileDto(existing);
    }

    const profile = await staffProfileRepository.upsertByAuthUserId(
      authUserId,
      null,
    );

    return toStaffProfileDto(profile);
  },

  async updateAvatar(authUserId: string, avatarMediaId: string | null) {
    if (avatarMediaId) {
      await mediaService.getById(avatarMediaId);
    }

    const profile = await staffProfileRepository.updateAvatar(
      authUserId,
      avatarMediaId,
    );

    return toStaffProfileDto(profile);
  },
};
