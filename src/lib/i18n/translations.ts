import {
  APP_LANGUAGES,
  DEFAULT_LANGUAGE,
  type AppLanguage,
} from "@/lib/i18n/languages";
import {
  AUDIENCE_TYPES,
  DEFAULT_AUDIENCE,
  type AudienceType,
} from "@/lib/i18n/audiences";

type WithLanguage = {
  language: AppLanguage;
};

type WithAudience = {
  audience: AudienceType;
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

export function emptyAudienceLanguageRecord<T>(
  factory: (audience: AudienceType, language: AppLanguage) => T,
): Record<AudienceType, Record<AppLanguage, T>> {
  return AUDIENCE_TYPES.reduce(
    (accumulator, audience) => {
      accumulator[audience] = emptyLanguageRecord((language) =>
        factory(audience, language),
      );
      return accumulator;
    },
    {} as Record<AudienceType, Record<AppLanguage, T>>,
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

export function audienceTranslationsToRecord<T extends WithLanguage & WithAudience>(
  translations: T[],
  audience: AudienceType = DEFAULT_AUDIENCE,
): Record<AppLanguage, T | undefined> {
  return APP_LANGUAGES.reduce(
    (accumulator, language) => {
      accumulator[language] = translations.find(
        (entry) => entry.language === language && entry.audience === audience,
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

export function getPreferredAudienceTranslation<
  T extends WithLanguage & WithAudience,
>(
  translations: T[],
  language: AppLanguage = DEFAULT_LANGUAGE,
  audience: AudienceType = DEFAULT_AUDIENCE,
): T | undefined {
  return (
    translations.find(
      (entry) => entry.language === language && entry.audience === audience,
    ) ??
    translations.find(
      (entry) =>
        entry.language === DEFAULT_LANGUAGE && entry.audience === audience,
    ) ??
    translations.find((entry) => entry.audience === audience) ??
    getPreferredTranslation(translations, language)
  );
}
