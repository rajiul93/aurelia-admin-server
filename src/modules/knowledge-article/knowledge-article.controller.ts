import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import { isAppLanguage, type AppLanguage } from "@/lib/i18n/languages";
import {
  createKnowledgeArticleSchema,
  knowledgeArticleIdParamSchema,
  listKnowledgeArticlesQuerySchema,
  updateKnowledgeArticleSchema,
} from "./knowledge-article.schema";
import { knowledgeArticleService } from "./knowledge-article.service";

function parseLanguage(req: NextRequest): AppLanguage | undefined {
  const language = req.nextUrl.searchParams.get("language");
  if (!language || !isAppLanguage(language)) {
    return undefined;
  }
  return language;
}

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const knowledgeArticleController = {
  async list(req: NextRequest) {
    const query = parseQuery(
      req.nextUrl.searchParams,
      listKnowledgeArticlesQuerySchema,
    );
    const result = await knowledgeArticleService.list(query);
    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest, staffAuthUserId: string) {
    const body = await parseBody(req, createKnowledgeArticleSchema);
    const article = await knowledgeArticleService.create(
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(article, { status: 201 });
  },

  async getById(req: NextRequest, id: string) {
    const article = await knowledgeArticleService.getById(
      id,
      parseLanguage(req),
    );
    return success(article);
  },

  async update(req: NextRequest, id: string, staffAuthUserId: string) {
    const body = await parseBody(req, updateKnowledgeArticleSchema);
    const article = await knowledgeArticleService.update(
      id,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(article);
  },

  async delete(req: NextRequest, id: string, staffAuthUserId: string) {
    await knowledgeArticleService.delete(
      id,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, knowledgeArticleIdParamSchema).id;
  },
};
