import type { AppLanguage } from "@/lib/i18n/languages";

export type FeatureLifecycle =
  | "PLANNED"
  | "BETA"
  | "ACTIVE"
  | "DEPRECATED"
  | "HIDDEN"
  | "REMOVED";

export type AppUiStringTranslationDto = {
  language: AppLanguage;
  value: string;
};

export type AppUiStringDto = {
  id: string;
  key: string;
  lifecycle: FeatureLifecycle;
  translations: AppUiStringTranslationDto[];
  createdAt: string;
  updatedAt: string;
};
