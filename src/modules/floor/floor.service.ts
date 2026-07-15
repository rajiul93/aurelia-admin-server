import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { toFloorDto, toFloorDtoList, toTransitionPointDto } from "./floor.mapper";
import { floorRepository } from "./floor.repository";
import type {
  CreateFloorInput,
  CreateTransitionPointInput,
  UpdateFloorInput,
  UpdateTransitionPointInput,
} from "./floor.schema";

async function ensureTourExists(tourId: string) {
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { id: true },
  });

  if (!tour) {
    throw new NotFoundError("Tour not found");
  }
}

async function ensureFloor(tourId: string, floorId: string) {
  const floor = await floorRepository.findById(tourId, floorId);
  if (!floor) {
    throw new NotFoundError("Floor not found");
  }

  return floor;
}

async function ensureFloorNoAvailable(
  tourId: string,
  floorNo: number,
  excludeFloorId?: string,
) {
  const existing = await floorRepository.findByTourAndFloorNo(tourId, floorNo);

  if (existing && existing.id !== excludeFloorId) {
    throw new ConflictError(`Floor ${floorNo} already exists on this tour`);
  }
}

// A transition may only lead to another floor of the same tour — otherwise a
// route could walk a visitor into a tour they have no access to.
async function ensureConnectsToFloor(
  tourId: string,
  floorId: string,
  connectsToFloorId: string | null | undefined,
) {
  if (!connectsToFloorId) {
    return;
  }

  if (connectsToFloorId === floorId) {
    throw new ValidationError("A transition cannot connect a floor to itself");
  }

  const target = await floorRepository.findById(tourId, connectsToFloorId);
  if (!target) {
    throw new ValidationError("Connected floor not found on this tour");
  }
}

export const floorService = {
  async listByTour(tourId: string) {
    await ensureTourExists(tourId);
    const floors = await floorRepository.findByTourId(tourId);
    return toFloorDtoList(floors);
  },

  async getById(tourId: string, floorId: string) {
    const floor = await ensureFloor(tourId, floorId);
    return toFloorDto(floor);
  },

  async create(tourId: string, input: CreateFloorInput, audit?: AuditContext) {
    await ensureTourExists(tourId);
    await ensureFloorNoAvailable(tourId, input.floorNo);

    const floor = await floorRepository.create(tourId, {
      floorNo: input.floorNo,
      mapTileUrl: input.mapTileUrl,
      sortOrder: input.sortOrder,
      ...(input.coverMediaId
        ? { coverMedia: { connect: { id: input.coverMediaId } } }
        : {}),
      ...(input.translations
        ? {
            translations: {
              create: input.translations.map((translation) => ({
                language: translation.language,
                audience: translation.audience,
                name: translation.name,
              })),
            },
          }
        : {}),
    });

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
    input: UpdateFloorInput,
    audit?: AuditContext,
  ) {
    const existing = await ensureFloor(tourId, floorId);

    if (input.floorNo !== undefined) {
      await ensureFloorNoAvailable(tourId, input.floorNo, floorId);
    }

    const floor = await floorRepository.update(tourId, floorId, {
      ...(input.floorNo !== undefined ? { floorNo: input.floorNo } : {}),
      ...(input.mapTileUrl !== undefined ? { mapTileUrl: input.mapTileUrl } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      // undefined = leave as-is; null = clear the cover; an id = set it.
      ...(input.coverMediaId !== undefined
        ? {
            coverMedia: input.coverMediaId
              ? { connect: { id: input.coverMediaId } }
              : { disconnect: true },
          }
        : {}),
      ...(input.translations
        ? {
            translations: {
              deleteMany: {},
              create: input.translations.map((translation) => ({
                language: translation.language,
                audience: translation.audience,
                name: translation.name,
              })),
            },
          }
        : {}),
    });

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
    const existing = await ensureFloor(tourId, floorId);

    await floorRepository.delete(tourId, floorId);

    await auditService.log({
      module: "floor",
      actionType: "DELETE",
      entityId: floorId,
      previousValue: toFloorDto(existing),
      context: audit,
    });
  },

  async listTransitionPoints(tourId: string, floorId: string) {
    const floor = await ensureFloor(tourId, floorId);
    return floor.transitionPoints.map(toTransitionPointDto);
  },

  async createTransitionPoint(
    tourId: string,
    floorId: string,
    input: CreateTransitionPointInput,
    audit?: AuditContext,
  ) {
    await ensureFloor(tourId, floorId);
    await ensureConnectsToFloor(tourId, floorId, input.connectsToFloorId);

    const point = await floorRepository.createTransitionPoint(floorId, {
      type: input.type,
      latitude: input.latitude,
      longitude: input.longitude,
      sortOrder: input.sortOrder,
      ...(input.connectsToFloorId
        ? { connectsToFloor: { connect: { id: input.connectsToFloorId } } }
        : {}),
    });

    await auditService.log({
      module: "floor-transition-point",
      actionType: "CREATE",
      entityId: point.id,
      newValue: toTransitionPointDto(point),
      context: audit,
    });

    return toTransitionPointDto(point);
  },

  async updateTransitionPoint(
    tourId: string,
    floorId: string,
    pointId: string,
    input: UpdateTransitionPointInput,
    audit?: AuditContext,
  ) {
    await ensureFloor(tourId, floorId);

    const existing = await floorRepository.findTransitionPointById(
      floorId,
      pointId,
    );
    if (!existing) {
      throw new NotFoundError("Transition point not found");
    }

    if (input.connectsToFloorId !== undefined) {
      await ensureConnectsToFloor(tourId, floorId, input.connectsToFloorId);
    }

    const point = await floorRepository.updateTransitionPoint(pointId, {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.connectsToFloorId !== undefined
        ? input.connectsToFloorId
          ? { connectsToFloor: { connect: { id: input.connectsToFloorId } } }
          : { connectsToFloor: { disconnect: true } }
        : {}),
    });

    await auditService.log({
      module: "floor-transition-point",
      actionType: "UPDATE",
      entityId: point.id,
      previousValue: toTransitionPointDto(existing),
      newValue: toTransitionPointDto(point),
      context: audit,
    });

    return toTransitionPointDto(point);
  },

  async deleteTransitionPoint(
    tourId: string,
    floorId: string,
    pointId: string,
    audit?: AuditContext,
  ) {
    await ensureFloor(tourId, floorId);

    const existing = await floorRepository.findTransitionPointById(
      floorId,
      pointId,
    );
    if (!existing) {
      throw new NotFoundError("Transition point not found");
    }

    await floorRepository.deleteTransitionPoint(pointId);

    await auditService.log({
      module: "floor-transition-point",
      actionType: "DELETE",
      entityId: pointId,
      previousValue: toTransitionPointDto(existing),
      context: audit,
    });
  },
};
