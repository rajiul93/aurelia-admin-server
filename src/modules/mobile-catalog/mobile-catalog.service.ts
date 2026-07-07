import { DEFAULT_AUDIENCE } from "@/lib/i18n/audiences";
import { DEFAULT_LANGUAGE, type AppLanguage } from "@/lib/i18n/languages";
import { prisma } from "@/lib/prisma";

export const mobileCatalogService = {
  async listPublishedTours(language?: AppLanguage) {
    const tours = await prisma.tour.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: {
        translations: true,
        coverMedia: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    return tours.map((tour) => {
      // A tour has one translation per (language, audience). The catalog card
      // shows the default ADULTS title, preferring the requested language, then
      // falling back to the default language, then any available translation.
      const preferred =
        tour.translations.find(
          (entry) =>
            entry.language === language &&
            entry.audience === DEFAULT_AUDIENCE,
        ) ??
        tour.translations.find(
          (entry) =>
            entry.language === DEFAULT_LANGUAGE &&
            entry.audience === DEFAULT_AUDIENCE,
        ) ??
        tour.translations.find((entry) => entry.language === language) ??
        tour.translations.find((entry) => entry.language === DEFAULT_LANGUAGE) ??
        tour.translations[0];

      return {
        id: tour.id,
        slug: tour.slug,
        title: preferred?.title ?? tour.slug,
        coverUrl: tour.coverMedia?.url ?? null,
        language: preferred?.language ?? DEFAULT_LANGUAGE,
      };
    });
  },
};
