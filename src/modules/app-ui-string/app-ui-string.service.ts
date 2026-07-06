import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import { auditService, type AuditContext } from "@/lib/audit";
import {
  toAppUiStringDto,
  toAppUiStringDtoList,
} from "./app-ui-string.mapper";
import { appUiStringRepository } from "./app-ui-string.repository";
import type {
  CreateAppUiStringInput,
  ListAppUiStringsQuery,
  UpdateAppUiStringInput,
} from "./app-ui-string.schema";

function mapAudit(record: Awaited<ReturnType<typeof appUiStringRepository.findById>>) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    key: record.key,
    lifecycle: record.lifecycle,
    translations: record.translations.map((entry) => ({
      language: entry.language,
      value: entry.value,
    })),
  };
}

async function ensureUniqueKey(key: string, excludeId?: string) {
  const existing = await appUiStringRepository.findByKey(key);
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(`UI string key "${key}" already exists`);
  }
}

export const appUiStringService = {
  async list(query: ListAppUiStringsQuery) {
    const { records, total } = await appUiStringRepository.findMany(query);

    return {
      data: toAppUiStringDtoList(records),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  },

  async getById(id: string) {
    const record = await appUiStringRepository.findById(id);
    if (!record) {
      throw new NotFoundError("UI string not found");
    }

    return toAppUiStringDto(record);
  },

  async create(input: CreateAppUiStringInput, audit?: AuditContext) {
    await ensureUniqueKey(input.key);

    const record = await appUiStringRepository.create({
      key: input.key,
      lifecycle: input.lifecycle,
      translations: {
        create: input.translations.map((translation) => ({
          language: translation.language,
          value: translation.value,
        })),
      },
    });

    await appReleaseRepository.bumpAppContentVersion();

    await auditService.log({
      module: "app-ui-string",
      actionType: "CREATE",
      entityId: record.id,
      newValue: mapAudit(record),
      context: audit,
    });

    return toAppUiStringDto(record);
  },

  async update(id: string, input: UpdateAppUiStringInput, audit?: AuditContext) {
    const existing = await appUiStringRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("UI string not found");
    }

    if (input.key) {
      await ensureUniqueKey(input.key, id);
    }

    const record = await appUiStringRepository.update(id, {
      ...(input.key !== undefined ? { key: input.key } : {}),
      ...(input.lifecycle !== undefined ? { lifecycle: input.lifecycle } : {}),
      ...(input.translations
        ? {
            translations: {
              deleteMany: {},
              create: input.translations.map((translation) => ({
                language: translation.language,
                value: translation.value,
              })),
            },
          }
        : {}),
    });

    await appReleaseRepository.bumpAppContentVersion();

    await auditService.log({
      module: "app-ui-string",
      actionType: "UPDATE",
      entityId: record.id,
      previousValue: mapAudit(existing),
      newValue: mapAudit(record),
      context: audit,
    });

    return toAppUiStringDto(record);
  },

  async delete(id: string, audit?: AuditContext) {
    const existing = await appUiStringRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("UI string not found");
    }

    await appUiStringRepository.delete(id);
    await appReleaseRepository.bumpAppContentVersion();

    await auditService.log({
      module: "app-ui-string",
      actionType: "DELETE",
      entityId: id,
      previousValue: mapAudit(existing),
      context: audit,
    });
  },
};
