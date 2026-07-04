import type { Media } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type StaffProfileWithAvatar = {
  id: string;
  authUserId: string;
  avatarMediaId: string | null;
  avatarMedia: Media | null;
  createdAt: Date;
  updatedAt: Date;
};

export const staffProfileRepository = {
  findByAuthUserId(authUserId: string) {
    return prisma.staffProfile.findUnique({
      where: { authUserId },
      include: { avatarMedia: true },
    });
  },

  upsertByAuthUserId(authUserId: string, avatarMediaId: string | null) {
    return prisma.staffProfile.upsert({
      where: { authUserId },
      create: {
        authUserId,
        avatarMediaId,
      },
      update: {
        avatarMediaId,
      },
      include: { avatarMedia: true },
    });
  },

  updateAvatar(authUserId: string, avatarMediaId: string | null) {
    return prisma.staffProfile.upsert({
      where: { authUserId },
      create: {
        authUserId,
        avatarMediaId,
      },
      update: {
        avatarMediaId,
      },
      include: { avatarMedia: true },
    });
  },
};
