import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { auditService, type AuditContext } from "@/lib/audit";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import { Prisma } from "@/generated/prisma/client";
import type { AppLanguage } from "@/lib/i18n/languages";
import {
  toKnowledgeArticleDto,
  toKnowledgeArticleDtoList,
} from "./knowledge-article.mapper";
import { knowledgeArticleRepository } from "./knowledge-article.repository";
import type {
  CreateKnowledgeArticleInput,
  ListKnowledgeArticlesQuery,
  UpdateKnowledgeArticleInput,
} from "./knowledge-article.schema";

function auditSummary(
  article: Awaited<ReturnType<typeof knowledgeArticleRepository.findById>>,
) {
  if (!article) {
    return null;
  }

  return {
    id: article.id,
    key: article.key,
    category: article.category,
    includeInAssistant: article.includeInAssistant,
    sortOrder: article.sortOrder,
    languages: article.translations.map((entry) => entry.language),
  };
}

export const knowledgeArticleService = {
  async list(query: ListKnowledgeArticlesQuery) {
    const { articles, total } = await knowledgeArticleRepository.findMany(query);

    return {
      data: toKnowledgeArticleDtoList(
        articles,
        query.language as AppLanguage | undefined,
      ),
      meta: { page: query.page, limit: query.limit, total },
    };
  },

  async getById(id: string, language?: AppLanguage) {
    const article = await knowledgeArticleRepository.findById(id);
    if (!article) {
      throw new NotFoundError("Knowledge article not found");
    }

    return toKnowledgeArticleDto(article, language);
  },

  async create(input: CreateKnowledgeArticleInput, audit?: AuditContext) {
    let article;
    try {
      article = await knowledgeArticleRepository.create({
        key: input.key,
        category: input.category,
        includeInAssistant: input.includeInAssistant,
        sortOrder: input.sortOrder,
        icon: input.icon,
        translations: {
          create: input.translations.map((translation) => ({
            language: translation.language,
            title: translation.title,
            bodyHtml: translation.bodyHtml,
            bodyText: translation.bodyText,
          })),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(`Key "${input.key}" is already in use`);
      }
      throw error;
    }

    await appReleaseRepository.bumpKnowledgeVersion();

    await auditService.log({
      module: "knowledge-article",
      actionType: "CREATE",
      entityId: article.id,
      newValue: auditSummary(article),
      context: audit,
    });

    return toKnowledgeArticleDto(article);
  },

  async update(
    id: string,
    input: UpdateKnowledgeArticleInput,
    audit?: AuditContext,
  ) {
    const existing = await knowledgeArticleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Knowledge article not found");
    }

    let article;
    try {
      article = await knowledgeArticleRepository.update(id, {
        ...(input.key !== undefined ? { key: input.key } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.includeInAssistant !== undefined
          ? { includeInAssistant: input.includeInAssistant }
          : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.translations
          ? {
              translations: {
                deleteMany: {},
                create: input.translations.map((translation) => ({
                  language: translation.language,
                  title: translation.title,
                  bodyHtml: translation.bodyHtml,
                  bodyText: translation.bodyText,
                })),
              },
            }
          : {}),
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictError(`Key "${input.key}" is already in use`);
      }
      throw error;
    }

    await appReleaseRepository.bumpKnowledgeVersion();

    await auditService.log({
      module: "knowledge-article",
      actionType: "UPDATE",
      entityId: article.id,
      previousValue: auditSummary(existing),
      newValue: auditSummary(article),
      context: audit,
    });

    return toKnowledgeArticleDto(article);
  },

  async delete(id: string, audit?: AuditContext) {
    const existing = await knowledgeArticleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Knowledge article not found");
    }

    await knowledgeArticleRepository.delete(id);
    await appReleaseRepository.bumpKnowledgeVersion();

    await auditService.log({
      module: "knowledge-article",
      actionType: "DELETE",
      entityId: id,
      previousValue: auditSummary(existing),
      context: audit,
    });
  },
};
