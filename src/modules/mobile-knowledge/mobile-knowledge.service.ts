import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import { APP_LANGUAGES, type AppLanguage } from "@/lib/i18n/languages";
import { prisma } from "@/lib/prisma";

type LocalizedText = Record<AppLanguage, string>;

function emptyLocalized(): LocalizedText {
  return { en: "", es: "", fr: "" };
}

/**
 * Bundle of all admin-managed content the mobile app downloads once and stores
 * encrypted for offline use. Includes every supported language so the app can
 * switch language offline without re-downloading.
 */
export const mobileKnowledgeService = {
  async getPack() {
    const [config, faqs, articles] = await Promise.all([
      appReleaseRepository.getConfig(),
      prisma.faq.findMany({
        include: {
          translations: true,
          category: { include: { translations: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.knowledgeArticle.findMany({
        where: { lifecycle: { in: ["ACTIVE", "BETA"] } },
        include: { translations: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    const faqDtos = faqs.map((faq) => {
      const question = emptyLocalized();
      const answerText = emptyLocalized();
      const answerHtml = emptyLocalized();

      for (const language of APP_LANGUAGES) {
        const t = faq.translations.find((entry) => entry.language === language);
        if (t) {
          question[language] = t.question;
          answerText[language] = t.answer_text;
          answerHtml[language] = t.answer_html;
        }
      }

      const categoryTitle = emptyLocalized();
      for (const language of APP_LANGUAGES) {
        const t = faq.category.translations.find(
          (entry) => entry.language === language,
        );
        if (t) {
          categoryTitle[language] = t.title;
        }
      }

      return {
        id: faq.id,
        categoryId: faq.categoryId,
        categoryTitle,
        question,
        answerText,
        answerHtml,
      };
    });

    const knowledgeDtos = articles
      .filter((article) => article.category === "KNOWLEDGE")
      .filter((article) => article.includeInAssistant)
      .map((article) => localizeArticle(article));

    const pageDtos = articles
      .filter(
        (article) =>
          article.category === "INFO_PAGE" || article.category === "LEGAL",
      )
      .map((article) => localizeArticle(article));

    return {
      version: config.knowledgeVersion,
      languages: APP_LANGUAGES,
      faqs: faqDtos,
      knowledge: knowledgeDtos,
      pages: pageDtos,
    };
  },
};

function localizeArticle(article: {
  id: string;
  key: string;
  category: string;
  icon: string | null;
  sortOrder: number;
  translations: { language: string; title: string; bodyHtml: string; bodyText: string }[];
}) {
  const title = emptyLocalized();
  const bodyHtml = emptyLocalized();
  const bodyText = emptyLocalized();

  for (const language of APP_LANGUAGES) {
    const t = article.translations.find((entry) => entry.language === language);
    if (t) {
      title[language] = t.title;
      bodyHtml[language] = t.bodyHtml;
      bodyText[language] = t.bodyText;
    }
  }

  return {
    id: article.id,
    key: article.key,
    category: article.category,
    icon: article.icon,
    sortOrder: article.sortOrder,
    title,
    bodyHtml,
    bodyText,
  };
}
