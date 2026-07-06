import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import { auditService, type AuditContext } from "@/lib/audit";
import { mediaService } from "@/modules/media";
import { toAppAssetDto, toAppAssetDtoList } from "./app-asset.mapper";
import { appAssetRepository } from "./app-asset.repository";
import type {
  CreateAppAssetInput,
  ListAppAssetsQuery,
  UpdateAppAssetInput,
} from "./app-asset.schema";

function mapAudit(record: Awaited<ReturnType<typeof appAssetRepository.findById>>) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    key: record.key,
    mediaId: record.mediaId,
    timeOfDay: record.timeOfDay,
    lifecycle: record.lifecycle,
  };
}

async function ensureUniqueKey(key: string, excludeId?: string) {
  const existing = await appAssetRepository.findByKey(key);
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(`App asset key "${key}" already exists`);
  }
}

export const appAssetService = {
  async list(query: ListAppAssetsQuery) {
    const { records, total } = await appAssetRepository.findMany(query);

    return {
      data: toAppAssetDtoList(records),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  },

  async getById(id: string) {
    const record = await appAssetRepository.findById(id);
    if (!record) {
      throw new NotFoundError("App asset not found");
    }

    return toAppAssetDto(record);
  },

  async create(input: CreateAppAssetInput, audit?: AuditContext) {
    await ensureUniqueKey(input.key);
    await mediaService.getById(input.mediaId);

    const record = await appAssetRepository.create({
      key: input.key,
      lifecycle: input.lifecycle,
      timeOfDay: input.timeOfDay ?? null,
      media: { connect: { id: input.mediaId } },
    });

    await appReleaseRepository.bumpAppContentVersion();

    await auditService.log({
      module: "app-asset",
      actionType: "CREATE",
      entityId: record.id,
      newValue: mapAudit(record),
      context: audit,
    });

    return toAppAssetDto(record);
  },

  async update(id: string, input: UpdateAppAssetInput, audit?: AuditContext) {
    const existing = await appAssetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("App asset not found");
    }

    if (input.key) {
      await ensureUniqueKey(input.key, id);
    }

    if (input.mediaId) {
      await mediaService.getById(input.mediaId);
    }

    const record = await appAssetRepository.update(id, {
      ...(input.key !== undefined ? { key: input.key } : {}),
      ...(input.lifecycle !== undefined ? { lifecycle: input.lifecycle } : {}),
      ...(input.timeOfDay !== undefined ? { timeOfDay: input.timeOfDay } : {}),
      ...(input.mediaId !== undefined
        ? { media: { connect: { id: input.mediaId } } }
        : {}),
    });

    await appReleaseRepository.bumpAppContentVersion();

    await auditService.log({
      module: "app-asset",
      actionType: "UPDATE",
      entityId: record.id,
      previousValue: mapAudit(existing),
      newValue: mapAudit(record),
      context: audit,
    });

    return toAppAssetDto(record);
  },

  async delete(id: string, audit?: AuditContext) {
    const existing = await appAssetRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("App asset not found");
    }

    await appAssetRepository.delete(id);
    await appReleaseRepository.bumpAppContentVersion();

    await auditService.log({
      module: "app-asset",
      actionType: "DELETE",
      entityId: id,
      previousValue: mapAudit(existing),
      context: audit,
    });
  },
};
