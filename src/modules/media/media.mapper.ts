import type { Media } from "@/generated/prisma/client";
import type { MediaDto } from "./media.types";

export function toMediaDto(media: Media): MediaDto {
  return {
    id: media.id,
    fileName: media.fileName,
    originalName: media.originalName,
    url: media.url,
    key: media.key,
    mimeType: media.mimeType,
    size: media.size,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
  };
}
