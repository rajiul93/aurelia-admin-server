import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { hashPin } from "@/lib/mobile/pin";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { tourRepository } from "@/modules/tour/tour.repository";
import {
  toTourAccessDto,
  toTourAccessDtoList,
} from "./tour-access.mapper";
import { tourAccessRepository } from "./tour-access.repository";
import type {
  CreateTourAccessInput,
  ListTourAccessQuery,
  UpdateTourAccessInput,
} from "./tour-access.schema";
import type { DeviceSessionDto } from "./tour-access.types";

function mapAuditAccess(
  access: Awaited<ReturnType<typeof tourAccessRepository.findById>>,
) {
  if (!access) {
    return null;
  }

  // Never the pinHash: audit rows are read by staff and exported.
  return {
    id: access.id,
    phone: access.phone,
    email: access.email,
    activatedAt: access.activatedAt.toISOString(),
    expiresAt: access.expiresAt.toISOString(),
    status: access.status,
    maxDevices: access.maxDevices,
    allowSubscriptionFeatures: access.allowSubscriptionFeatures,
    notes: access.notes,
    tourIds: access.tours.map((entry) => entry.tourId),
    activeDeviceCount: access.deviceSessions.length,
  };
}

async function assertTourIds(tourIds: string[]) {
  const uniqueIds = [...new Set(tourIds)];

  for (const tourId of uniqueIds) {
    const tour = await tourRepository.findById(tourId);
    if (!tour) {
      throw new ValidationError(`Tour not found: ${tourId}`);
    }
  }

  return uniqueIds;
}

export const tourAccessService = {
  async list(query: ListTourAccessQuery) {
    const { records, total } = await tourAccessRepository.findMany(query);

    return {
      data: toTourAccessDtoList(records),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  },

  async getById(id: string) {
    const access = await tourAccessRepository.findById(id);
    if (!access) {
      throw new NotFoundError("Tour access record not found");
    }

    return toTourAccessDto(access);
  },

  async create(
    input: CreateTourAccessInput,
    staffAuthUserId: string,
    audit?: AuditContext,
  ) {
    const tourIds = await assertTourIds(input.tourIds);
    const phone = normalizePhone(input.phone);

    const existing = await prisma.tourAccess.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictError(
        "A tour access already exists for this phone number.",
      );
    }

    const access = await tourAccessRepository.create({
      phone,
      pinHash: await hashPin(input.pin),
      email: input.email?.toLowerCase(),
      activatedAt: input.activatedAt,
      expiresAt: input.expiresAt,
      maxDevices: input.maxDevices,
      allowSubscriptionFeatures: input.allowSubscriptionFeatures,
      notes: input.notes,
      activatedById: staffAuthUserId,
      tours: {
        create: tourIds.map((tourId) => ({ tourId })),
      },
    });

    await auditService.log({
      module: "tour-access",
      actionType: "CREATE",
      entityId: access.id,
      newValue: mapAuditAccess(access),
      context: audit,
    });

    return toTourAccessDto(access);
  },

  async update(id: string, input: UpdateTourAccessInput, audit?: AuditContext) {
    const existing = await tourAccessRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Tour access record not found");
    }

    if (input.tourIds) {
      await assertTourIds(input.tourIds);
    }

    if (input.maxDevices !== undefined) {
      const activeCount = existing.deviceSessions.length;
      if (input.maxDevices < activeCount) {
        throw new ValidationError(
          `Device limit cannot be lower than the ${activeCount} device${
            activeCount === 1 ? "" : "s"
          } already active. Remove a device first.`,
        );
      }
    }

    const phone =
      input.phone !== undefined ? normalizePhone(input.phone) : undefined;

    if (phone !== undefined && phone !== existing.phone) {
      const clash = await prisma.tourAccess.findUnique({ where: { phone } });
      if (clash) {
        throw new ConflictError(
          "A tour access already exists for this phone number.",
        );
      }
    }

    // A window change can make a locked-out buyer wait needlessly; a new PIN
    // must clear the lockout, or the admin's fix would not take effect for 15
    // minutes.
    const resetLockout =
      input.pin !== undefined
        ? { failedPinAttempts: 0, pinLockedUntil: null }
        : {};

    const access = await tourAccessRepository.update(id, {
      ...(phone !== undefined ? { phone } : {}),
      ...(input.pin !== undefined ? { pinHash: await hashPin(input.pin) } : {}),
      ...resetLockout,
      ...(input.email !== undefined
        ? { email: input.email ? input.email.toLowerCase() : null }
        : {}),
      ...(input.activatedAt !== undefined
        ? { activatedAt: input.activatedAt }
        : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      ...(input.maxDevices !== undefined ? { maxDevices: input.maxDevices } : {}),
      ...(input.allowSubscriptionFeatures !== undefined
        ? { allowSubscriptionFeatures: input.allowSubscriptionFeatures }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.tourIds
        ? {
            tours: {
              deleteMany: {},
              create: [...new Set(input.tourIds)].map((tourId) => ({ tourId })),
            },
          }
        : {}),
    });

    const actionType =
      input.status === "REVOKED" && existing.status !== "REVOKED"
        ? ("REVOKE" as const)
        : ("UPDATE" as const);

    await auditService.log({
      module: "tour-access",
      actionType,
      entityId: access.id,
      previousValue: mapAuditAccess(existing),
      newValue: mapAuditAccess(access),
      context: audit,
    });

    return toTourAccessDto(access);
  },

  async revoke(id: string, audit?: AuditContext) {
    return this.update(id, { status: "REVOKED" }, audit);
  },

  async listDeviceSessions(accessId: string): Promise<DeviceSessionDto[]> {
    const access = await tourAccessRepository.findById(accessId);
    if (!access) {
      throw new NotFoundError("Tour access record not found");
    }

    const sessions = await prisma.deviceSession.findMany({
      where: { tourAccessId: accessId, revokedAt: null },
      orderBy: { lastVerifiedAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      platform: session.platform,
      lastVerifiedAt: session.lastVerifiedAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
    }));
  },

  async revokeDeviceSession(
    accessId: string,
    sessionId: string,
    audit?: AuditContext,
  ) {
    const access = await tourAccessRepository.findById(accessId);
    if (!access) {
      throw new NotFoundError("Tour access record not found");
    }

    const session = await prisma.deviceSession.findFirst({
      where: {
        id: sessionId,
        tourAccessId: accessId,
        revokedAt: null,
      },
    });

    if (!session) {
      throw new NotFoundError("Active device session not found");
    }

    await prisma.deviceSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        sessionTokenHash: null,
      },
    });

    await prisma.deviceRegistration.updateMany({
      where: {
        deviceId: session.deviceId,
        tourAccessId: accessId,
      },
      data: { revokedAt: new Date() },
    });

    await auditService.log({
      module: "tour-access",
      actionType: "REVOKE",
      entityId: accessId,
      previousValue: {
        sessionId: session.id,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        platform: session.platform,
      },
      newValue: { revoked: true },
      context: audit,
    });

    return {
      revoked: true,
      sessionId: session.id,
      deviceId: session.deviceId,
    };
  },

  async delete(id: string, audit?: AuditContext) {
    const existing = await tourAccessRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Tour access record not found");
    }

    if (existing.deviceSessions.length > 0) {
      throw new ValidationError(
        "Cannot delete access with active device sessions. Revoke access first.",
      );
    }

    await tourAccessRepository.delete(id);

    await auditService.log({
      module: "tour-access",
      actionType: "DELETE",
      entityId: id,
      previousValue: mapAuditAccess(existing),
      context: audit,
    });
  },
};
