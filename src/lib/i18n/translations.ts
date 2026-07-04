import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE,
  type AppLanguage,
} from "@/lib/i18n/languages";

type WithLanguage = {
  language: AppLanguage;
};

export function emptyLanguageRecord<T>(
  factory: (language: AppLanguage) => T,
): Record<AppLanguage, T> {
  return APP_LANGUAGES.reduce(
    (accumulator, language) => {
      accumulator[language] = factory(language);
      return accumulator;
    },
    {} as Record<AppLanguage, T>,
  );
}

export function translationsToRecord<T extends WithLanguage>(
  translations: T[],
): Record<AppLanguage, T | undefined> {
  return APP_LANGUAGES.reduce(
    (accumulator, language) => {
      accumulator[language] = translations.find(
        (entry) => entry.language === language,
      );
      return accumulator;
    },
    {} as Record<AppLanguage, T | undefined>,
  );
}

export function getPreferredTranslation<T extends WithLanguage>(
  translations: T[],
  language: AppLanguage = DEFAULT_LANGUAGE,
): T | undefined {
  return (
    translations.find((entry) => entry.language === language) ??
    translations.find((entry) => entry.language === DEFAULT_LANGUAGE) ??
    translations[0]
  );
}
