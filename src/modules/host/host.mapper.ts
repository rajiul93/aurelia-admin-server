import type { Host, Media, HostTranslation } from "@/generated/prisma/client";
import type { HostDto } from "./host.types";

export function toHostDto(
  host: Host & { photoMedia: Media | null; translations: HostTranslation[] }
): HostDto {
  return {
    id: host.id,
    tourId: host.tourId,
    name: host.name,
    role: host.role ?? null,
    photoMediaId: host.photoMediaId ?? null,
    photoUrl: host.photoMedia?.url ?? null,
    latitude: Number(host.latitude),
    longitude: Number(host.longitude),
    availableFrom: host.availableFrom ?? null,
    availableTo: host.availableTo ?? null,
    isActive: host.isActive,
    sortOrder: host.sortOrder,
    translations: host.translations.map((t) => ({
      language: t.language as "en" | "es" | "fr",
      bio: t.bio,
    })),
    createdAt: host.createdAt.toISOString(),
    updatedAt: host.updatedAt.toISOString(),
  };
}

export function toHostDtoList(
  hosts: Array<Host & { photoMedia: Media | null; translations: HostTranslation[] }>
): HostDto[] {
  return hosts.map(toHostDto);
}
