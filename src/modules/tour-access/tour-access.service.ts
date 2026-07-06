import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
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

function mapAuditAccess(
  access: Awaited<ReturnType<typeof tourAccessRepository.findById>>,
) {
  if (!access) {
    return null;
  }

  return {
    id: access.id,
    email: access.email,
    expiresAt: access.expiresAt.toISOString(),
    status: access.status,
    ticketCount: access.ticketCount,
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

    const access = await tourAccessRepository.create({
      email: input.email.toLowerCase(),
      expiresAt: input.expiresAt,
      ticketCount: input.ticketCount,
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

    const access = await tourAccessRepository.update(id, {
      ...(input.email !== undefined
        ? { email: input.email.toLowerCase() }
        : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      ...(input.ticketCount !== undefined ? { ticketCount: input.ticketCount } : {}),
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
