import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import { isAppLanguage, type AppLanguage } from "@/lib/i18n/languages";
import {
  createFaqSchema,
  faqIdParamSchema,
  listFaqsQuerySchema,
  updateFaqSchema,
} from "./faq.schema";
import { faqService } from "./faq.service";

function parseLanguage(req: NextRequest): AppLanguage | undefined {
  const language = req.nextUrl.searchParams.get("language");
  if (!language) {
    return undefined;
  }

  if (!isAppLanguage(language)) {
    return undefined;
  }

  return language;
}

export const faqController = {
  async list(req: NextRequest) {
    const query = parseQuery(req.nextUrl.searchParams, listFaqsQuerySchema);
    const result = await faqService.list(query);

    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest) {
    const body = await parseBody(req, createFaqSchema);
    const faq = await faqService.create(body);

    return success(faq, { status: 201 });
  },

  async getById(req: NextRequest, id: string) {
    const faq = await faqService.getById(id, parseLanguage(req));
    return success(faq);
  },

  async update(req: NextRequest, id: string) {
    const body = await parseBody(req, updateFaqSchema);
    const faq = await faqService.update(id, body);

    return success(faq);
  },

  async delete(id: string) {
    await faqService.delete(id);
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, faqIdParamSchema).id;
  },
};
