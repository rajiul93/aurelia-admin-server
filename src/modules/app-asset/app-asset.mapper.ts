import type { AppAsset, Media } from "@/generated/prisma/client";
import type { Media as MediaDto } from "@/types/media";
import type { FeatureLifecycle } from "@/modules/app-ui-string/app-ui-string.types";
import type { AppAssetDto, TimeOfDay } from "./app-asset.types";

type AppAssetWithMedia = AppAsset & { media: Media };

function mapMedia(media: Media): MediaDto {
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

export function toAppAssetDto(record: AppAssetWithMedia): AppAssetDto {
  return {
    id: record.id,
    key: record.key,
    mediaId: record.mediaId,
    media: mapMedia(record.media),
    timeOfDay: record.timeOfDay as TimeOfDay | null,
    lifecycle: record.lifecycle as FeatureLifecycle,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toAppAssetDtoList(records: AppAssetWithMedia[]) {
  return records.map(toAppAssetDto);
}
