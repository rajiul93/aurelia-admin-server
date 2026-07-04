import { toMediaDto } from "@/modules/media/media.mapper";
import type { StaffProfileWithAvatar } from "./staff-profile.repository";
import type { StaffProfileDto } from "./staff-profile.types";

export function toStaffProfileDto(
  profile: StaffProfileWithAvatar,
): StaffProfileDto {
  return {
    authUserId: profile.authUserId,
    avatarMediaId: profile.avatarMediaId,
    avatarMedia: profile.avatarMedia ? toMediaDto(profile.avatarMedia) : null,
  };
}
