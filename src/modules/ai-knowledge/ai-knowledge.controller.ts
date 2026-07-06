import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams } from "@/lib/api/validate";
import {
  createAiKnowledgeSchema,
  knowledgeIdParamSchema,
  tourIdParamSchema,
  updateAiKnowledgeSchema,
} from "./ai-knowledge.schema";
import { aiKnowledgeService } from "./ai-knowledge.service";

function getAuditContext(req: NextRequest, staffAuthUserId: string) {
  return {
    staffAuthUserId,
    ipAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip"),
  };
}

export const aiKnowledgeController = {
  async list(_req: NextRequest, tourId: string) {
    const records = await aiKnowledgeService.listByTour(tourId);
    return success(records);
  },

  async create(req: NextRequest, tourId: string, staffAuthUserId: string) {
    const body = await parseBody(req, createAiKnowledgeSchema);
    const knowledge = await aiKnowledgeService.create(
      tourId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(knowledge, { status: 201 });
  },

  async getById(_req: NextRequest, tourId: string, knowledgeId: string) {
    const knowledge = await aiKnowledgeService.getById(tourId, knowledgeId);
    return success(knowledge);
  },

  async update(
    req: NextRequest,
    tourId: string,
    knowledgeId: string,
    staffAuthUserId: string,
  ) {
    const body = await parseBody(req, updateAiKnowledgeSchema);
    const knowledge = await aiKnowledgeService.update(
      tourId,
      knowledgeId,
      body,
      getAuditContext(req, staffAuthUserId),
    );
    return success(knowledge);
  },

  async delete(
    req: NextRequest,
    tourId: string,
    knowledgeId: string,
    staffAuthUserId: string,
  ) {
    await aiKnowledgeService.delete(
      tourId,
      knowledgeId,
      getAuditContext(req, staffAuthUserId),
    );
    return success({ deleted: true });
  },

  parseTourParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, tourIdParamSchema);
  },

  parseKnowledgeParams(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, knowledgeIdParamSchema);
  },
};
