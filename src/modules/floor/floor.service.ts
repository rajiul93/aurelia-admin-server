import { NotFoundError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { floorRepository } from "./floor.repository";
import { toFloorDto } from "./floor.mapper";

export const floorService = {
  async listByTour(tourId: string) {
    const floors = await floorRepository.findByTourId(tourId);
    return floors.map(toFloorDto);
  },

  async getById(tourId: string, floorId: string) {
    const floor = await floorRepository.findById(floorId);
    if (!floor || floor.tourId !== tourId) {
      throw new NotFoundError("Floor not found");
    }
    return toFloorDto(floor);
  },

  async create(
    tourId: string,
    data: { floorNo: number; mapTileUrl?: string },
    audit?: AuditContext,
  ) {
    const floor = await floorRepository.create({
      tourId,
      floorNo: data.floorNo,
      ...(data.mapTileUrl && { mapTileUrl: data.mapTileUrl }),
    } as any);

    await auditService.log({
      module: "floor",
      actionType: "CREATE",
      entityId: floor.id,
      newValue: toFloorDto(floor),
      context: audit,
    });

    return toFloorDto(floor);
  },

  async update(
    tourId: string,
    floorId: string,
    data: { floorNo?: number; mapTileUrl?: string | null },
    audit?: AuditContext,
  ) {
    const existing = await floorRepository.findById(floorId);
    if (!existing || existing.tourId !== tourId) {
      throw new NotFoundError("Floor not found");
    }

    const floor = await floorRepository.update(floorId, data);

    await auditService.log({
      module: "floor",
      actionType: "UPDATE",
      entityId: floor.id,
      previousValue: toFloorDto(existing),
      newValue: toFloorDto(floor),
      context: audit,
    });

    return toFloorDto(floor);
  },

  async delete(tourId: string, floorId: string, audit?: AuditContext) {
    const existing = await floorRepository.findById(floorId);
    if (!existing || existing.tourId !== tourId) {
      throw new NotFoundError("Floor not found");
    }

    await floorRepository.delete(floorId);

    await auditService.log({
      module: "floor",
      actionType: "DELETE",
      entityId: floorId,
      previousValue: toFloorDto(existing),
      context: audit,
    });
  },
};
