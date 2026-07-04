import { ConflictError, NotFoundError, ValidationError } from "@/lib/api/errors";
import type { AppLanguage } from "@/lib/i18n/languages";
import { mediaService } from "@/modules/media";
import { toFaqCategoryDto, toFaqCategoryDtoList } from "./faq-category.mapper";
import { faqCategoryRepository } from "./faq-category.repository";
import type {
  CreateFaqCategoryInput,
  ListFaqCategoriesQuery,
  UpdateFaqCategoryInput,
} from "./faq-category.schema";

async function assertUniqueSlugs(
  translations: CreateFaqCategoryInput["translations"],
  excludeCategoryId?: string,
) {
  for (const translation of translations) {
    const existing = await faqCategoryRepository.findBySlug(
      translation.slug,
      translation.language,
    );

    if (
      existing &&
      (!excludeCategoryId || existing.categoryId !== excludeCategoryId)
    ) {
      throw new ConflictError(
        `A category with slug "${translation.slug}" already exists for ${translation.language}`,
      );
    }
  }
}

export const faqCategoryService = {
  async list(query: ListFaqCategoriesQuery) {
    const { categories, total } = await faqCategoryRepository.findMany(query);

    return {
      data: toFaqCategoryDtoList(
        categories,
        query.language as AppLanguage | undefined,
      ),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  },

  async getById(id: string, language?: AppLanguage) {
    const category = await faqCategoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError("FAQ category not found");
    }

    return toFaqCategoryDto(category, language);
  },

  async create(input: CreateFaqCategoryInput) {
    await assertUniqueSlugs(input.translations);

    if (input.imageMediaId) {
      await mediaService.getById(input.imageMediaId);
    }

    const category = await faqCategoryRepository.create({
      imageMedia: input.imageMediaId
        ? { connect: { id: input.imageMediaId } }
        : undefined,
      translations: {
        create: input.translations.map((translation) => ({
          language: translation.language,
          title: translation.title,
          slug: translation.slug,
        })),
      },
    });

    return toFaqCategoryDto(category);
  },

  async update(id: string, input: UpdateFaqCategoryInput) {
    const existing = await faqCategoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("FAQ category not found");
    }

    if (input.translations) {
      await assertUniqueSlugs(input.translations, id);
    }

    if (input.imageMediaId) {
      await mediaService.getById(input.imageMediaId);
    }

    const category = await faqCategoryRepository.update(id, {
      ...(input.imageMediaId !== undefined
        ? input.imageMediaId
          ? { imageMedia: { connect: { id: input.imageMediaId } } }
          : { imageMedia: { disconnect: true } }
        : {}),
      ...(input.translations
        ? {
            translations: {
              deleteMany: {},
              create: input.translations.map((translation) => ({
                language: translation.language,
                title: translation.title,
                slug: translation.slug,
              })),
            },
          }
        : {}),
    });

    return toFaqCategoryDto(category);
  },

  async delete(id: string) {
    const existing = await faqCategoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("FAQ category not found");
    }

    const faqCount = await faqCategoryRepository.countFaqs(id);
    if (faqCount > 0) {
      throw new ValidationError(
        "Cannot delete a category that still has FAQs. Move or delete those FAQs first.",
      );
    }

    await faqCategoryRepository.delete(id);
  },
};
