import type { NextRequest } from "next/server";
import { success } from "@/lib/api/response";
import { parseBody, parseParams, parseQuery } from "@/lib/api/validate";
import { isAppLanguage, type AppLanguage } from "@/lib/i18n/languages";
import {
  createFaqCategorySchema,
  faqCategoryIdParamSchema,
  listFaqCategoriesQuerySchema,
  updateFaqCategorySchema,
} from "./faq-category.schema";
import { faqCategoryService } from "./faq-category.service";

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

export const faqCategoryController = {
  async list(req: NextRequest) {
    const query = parseQuery(
      req.nextUrl.searchParams,
      listFaqCategoriesQuerySchema,
    );
    const result = await faqCategoryService.list(query);

    return success(result.data, { meta: result.meta });
  },

  async create(req: NextRequest) {
    const body = await parseBody(req, createFaqCategorySchema);
    const category = await faqCategoryService.create(body);

    return success(category, { status: 201 });
  },

  async getById(req: NextRequest, id: string) {
    const category = await faqCategoryService.getById(id, parseLanguage(req));
    return success(category);
  },

  async update(req: NextRequest, id: string) {
    const body = await parseBody(req, updateFaqCategorySchema);
    const category = await faqCategoryService.update(id, body);

    return success(category);
  },

  async delete(id: string) {
    await faqCategoryService.delete(id);
    return success({ deleted: true });
  },

  parseId(params: Record<string, string | string[] | undefined>) {
    return parseParams(params, faqCategoryIdParamSchema).id;
  },
};
