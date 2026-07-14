import type { Floor } from "@/generated/prisma/client";

export type FloorDto = {
  id: string;
  tourId: string;
  floorNo: number;
  mapTileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toFloorDto(floor: Floor): FloorDto {
  return {
    id: floor.id,
    tourId: floor.tourId,
    floorNo: floor.floorNo,
    mapTileUrl: floor.mapTileUrl ?? null,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
  };
}
