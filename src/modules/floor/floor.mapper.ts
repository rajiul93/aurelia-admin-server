import type { FloorTransitionPoint } from "@/generated/prisma/client";
import type { AudienceType } from "@/lib/i18n/audiences";
import type { AppLanguage } from "@/lib/i18n/languages";
import type { FloorWithRelations } from "./floor.repository";

export type FloorTranslationDto = {
  language: AppLanguage;
  audience: AudienceType;
  name: string;
};

export type TransitionPointDto = {
  id: string;
  floorId: string;
  type: FloorTransitionPoint["type"];
  latitude: number;
  longitude: number;
  connectsToFloorId: string | null;
  sortOrder: number;
};

export type FloorMediaDto = {
  id: string;
  url: string;
};

export type FloorDto = {
  id: string;
  tourId: string;
  floorNo: number;
  mapTileUrl: string | null;
  sortOrder: number;
  coverMediaId: string | null;
  coverMedia: FloorMediaDto | null;
  translations: FloorTranslationDto[];
  transitionPoints: TransitionPointDto[];
  spotCount: number;
  routeEdgeCount: number;
  createdAt: string;
  updatedAt: string;
};

export function toTransitionPointDto(
  point: FloorTransitionPoint,
): TransitionPointDto {
  return {
    id: point.id,
    floorId: point.floorId,
    type: point.type,
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
    connectsToFloorId: point.connectsToFloorId,
    sortOrder: point.sortOrder,
  };
}

export function toFloorDto(floor: FloorWithRelations): FloorDto {
  return {
    id: floor.id,
    tourId: floor.tourId,
    floorNo: floor.floorNo,
    mapTileUrl: floor.mapTileUrl,
    sortOrder: floor.sortOrder,
    coverMediaId: floor.coverMediaId,
    coverMedia: floor.coverMedia
      ? { id: floor.coverMedia.id, url: floor.coverMedia.url }
      : null,
    translations: floor.translations.map((translation) => ({
      language: translation.language as AppLanguage,
      audience: translation.audience as AudienceType,
      name: translation.name,
    })),
    transitionPoints: floor.transitionPoints.map(toTransitionPointDto),
    spotCount: floor.spots.length,
    routeEdgeCount: floor.route?.edges.length ?? 0,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  };
}

export function toFloorDtoList(floors: FloorWithRelations[]): FloorDto[] {
  return floors.map(toFloorDto);
}
