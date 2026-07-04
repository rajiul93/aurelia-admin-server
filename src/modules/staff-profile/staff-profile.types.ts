import type { MediaDto } from "@/modules/media/media.types";

export type StaffProfileDto = {
  authUserId: string;
  avatarMediaId: string | null;
  avatarMedia: MediaDto | null;
};
