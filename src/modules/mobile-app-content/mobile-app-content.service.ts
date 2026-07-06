import { DEFAULT_LANGUAGE, type AppLanguage } from "@/lib/i18n/languages";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import { prisma } from "@/lib/prisma";

export const mobileAppContentService = {
  async getBundle(language: AppLanguage = DEFAULT_LANGUAGE) {
    const config = await appReleaseRepository.getConfig();

    const [strings, assets] = await Promise.all([
      prisma.appUiString.findMany({
        where: { lifecycle: { in: ["ACTIVE", "BETA"] } },
        include: { translations: true },
        orderBy: { key: "asc" },
      }),
      prisma.appAsset.findMany({
        where: { lifecycle: { in: ["ACTIVE", "BETA"] } },
        include: { media: true },
        orderBy: { key: "asc" },
      }),
    ]);

    const stringMap = Object.fromEntries(
      strings.map((entry) => {
        const translation =
          entry.translations.find((item) => item.language === language) ??
          entry.translations.find((item) => item.language === DEFAULT_LANGUAGE) ??
          entry.translations[0];

        return [entry.key, translation?.value ?? ""];
      }),
    );

    const assetMap = Object.fromEntries(
      assets.map((entry) => [
        entry.key,
        {
          url: entry.media.url,
          timeOfDay: entry.timeOfDay,
          mimeType: entry.media.mimeType,
        },
      ]),
    );

    return {
      appContentVersion: config.appContentVersion,
      language,
      strings: stringMap,
      assets: assetMap,
    };
  },
};
