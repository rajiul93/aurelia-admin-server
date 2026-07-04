import { NotFoundError } from "@/lib/api/errors";
import type { AppLanguage } from "@/lib/i18n/languages";
import { faqCategoryService } from "@/modules/faq-category";
import { toFaqDto, toFaqDtoList } from "./faq.mapper";
import { faqRepository } from "./faq.repository";
import type {
  CreateFaqInput,
  ListFaqsQuery,
  UpdateFaqInput,
} from "./faq.schema";

export const faqService = {
  async list(query: ListFaqsQuery) {
    const { faqs, total } = await faqRepository.findMany(query);

    return {
      data: toFaqDtoList(faqs, query.language as AppLanguage | undefined),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  },

  async getById(id: string, language?: AppLanguage) {
    const faq = await faqRepository.findById(id);
    if (!faq) {
      throw new NotFoundError("FAQ not found");
    }

    return toFaqDto(faq, language);
  },

  async create(input: CreateFaqInput) {
    await faqCategoryService.getById(input.categoryId);

    const faq = await faqRepository.create({
      category: { connect: { id: input.categoryId } },
      translations: {
        create: input.translations.map((translation) => ({
          language: translation.language,
          question: translation.question,
          answer_text: translation.answer_text,
          answer_html: translation.answer_html,
        })),
      },
    });

    return toFaqDto(faq);
  },

  async update(id: string, input: UpdateFaqInput) {
    const existing = await faqRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("FAQ not found");
    }

    if (input.categoryId) {
      await faqCategoryService.getById(input.categoryId);
    }

    const faq = await faqRepository.update(id, {
      ...(input.categoryId !== undefined
        ? { category: { connect: { id: input.categoryId } } }
        : {}),
      ...(input.translations
        ? {
            translations: {
              deleteMany: {},
              create: input.translations.map((translation) => ({
                language: translation.language,
                question: translation.question,
                answer_text: translation.answer_text,
                answer_html: translation.answer_html,
              })),
            },
          }
        : {}),
    });

    return toFaqDto(faq);
  },

  async delete(id: string) {
    const existing = await faqRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("FAQ not found");
    }

    await faqRepository.delete(id);
  },
};
