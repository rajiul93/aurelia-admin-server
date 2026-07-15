import type { Prisma } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit/audit.service";
import { mediaService } from "@/modules/media/media.service";
import { prisma } from "@/lib/prisma";
import { hostRepository, hostIncludeRelations } from "./host.repository";
import { toHostDto, toHostDtoList } from "./host.mapper";
import type { CreateHostInput, UpdateHostInput } from "./host.schema";

async function ensureTourExists(tourId: string) {
  const tour = await prisma.tour.findUnique({ where: { id: tourId } });
  if (!tour) {
    throw new NotFoundError("Tour not found");
  }
  return tour;
}

async function ensureHost(tourId: string, hostId: string) {
  const host = await hostRepository.findById(tourId, hostId);
  if (!host) {
    throw new NotFoundError("Host not found");
  }
  return host;
}

async function validatePhotoMedia(photoMediaId?: string | null) {
  if (photoMediaId && photoMediaId !== "") {
    const media = await mediaService.getById(photoMediaId);
    if (!media) {
      throw new NotFoundError("Media not found");
    }
  }
}

export const hostService = {
  async listByTour(tourId: string) {
    await ensureTourExists(tourId);
    const hosts = await hostRepository.findByTourId(tourId);
    return toHostDtoList(hosts);
  },

  async getById(tourId: string, hostId: string) {
    const host = await ensureHost(tourId, hostId);
    return toHostDto(host);
  },

  async create(tourId: string, input: CreateHostInput, context: AuditContext) {
    await ensureTourExists(tourId);

    if (input.photoMediaId) {
      await validatePhotoMedia(input.photoMediaId);
    }

    const createData: Prisma.HostCreateInput = {
      tour: { connect: { id: tourId } },
      name: input.name,
      role: input.role ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      availableFrom: input.availableFrom ?? null,
      availableTo: input.availableTo ?? null,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      translations: {
        create: Object.entries(input.translations).map(([language, data]) => ({
          language: language as "en" | "es" | "fr",
          bio: data.bio,
        })),
      },
    };

    if (input.photoMediaId) {
      createData.photoMedia = { connect: { id: input.photoMediaId } };
    }

    const host = await prisma.host.create({
      data: createData,
      include: hostIncludeRelations,
    });

    await auditService.log({
      module: "host",
      actionType: "CREATE",
      entityId: host.id,
      newValue: toHostDto(host),
      context,
    });

    return toHostDto(host);
  },

  async update(hostId: string, tourId: string, input: UpdateHostInput, context: AuditContext) {
    const existingHost = await ensureHost(tourId, hostId);

    if (input.photoMediaId !== undefined) {
      if (input.photoMediaId === null) {
        await hostRepository.update(hostId, {
          photoMedia: { disconnect: true },
        });
      } else if (input.photoMediaId) {
        await validatePhotoMedia(input.photoMediaId);
      }
    }

    const updateData: Prisma.HostUpdateInput = {
      name: input.name,
      role: input.role,
      latitude: input.latitude,
      longitude: input.longitude,
      availableFrom: input.availableFrom,
      availableTo: input.availableTo,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    };

    if (input.photoMediaId !== undefined) {
      if (input.photoMediaId === null) {
        updateData.photoMedia = { disconnect: true };
      } else if (input.photoMediaId) {
        updateData.photoMedia = { connect: { id: input.photoMediaId } };
      }
    }

    // Handle translations
    if (input.translations) {
      updateData.translations = {
        deleteMany: {},
        create: Object.entries(input.translations).map(([language, data]) => ({
          language: language as "en" | "es" | "fr",
          bio: data.bio,
        })),
      };
    }

    // Remove undefined keys
    Object.keys(updateData).forEach(
      (key) => {
        if ((updateData as Record<string, unknown>)[key] === undefined) {
          delete (updateData as Record<string, unknown>)[key];
        }
      }
    );

    const host = await hostRepository.update(hostId, updateData);

    await auditService.log({
      module: "host",
      actionType: "UPDATE",
      entityId: hostId,
      previousValue: toHostDto(existingHost),
      newValue: toHostDto(host),
      context,
    });

    return toHostDto(host);
  },

  async delete(hostId: string, tourId: string, context: AuditContext) {
    const host = await ensureHost(tourId, hostId);

    await hostRepository.delete(hostId);

    await auditService.log({
      module: "host",
      actionType: "DELETE",
      entityId: hostId,
      previousValue: toHostDto(host),
      context,
    });
  },
};
