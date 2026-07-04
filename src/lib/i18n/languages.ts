export const APP_LANGUAGES = ["en", "es", "fr"] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
};

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export function isAppLanguage(value: string): value is AppLanguage {
  return (APP_LANGUAGES as readonly string[]).includes(value);
}
