import type {
  AppUiString,
  AppUiStringTranslation,
} from "@/generated/prisma/client";
import type { AppLanguage } from "@/lib/i18n/languages";
import type {
  AppUiStringDto,
  AppUiStringTranslationDto,
  FeatureLifecycle,
} from "./app-ui-string.types";

type AppUiStringWithRelations = AppUiString & {
  translations: AppUiStringTranslation[];
};

function mapTranslation(
  entry: AppUiStringTranslation,
): AppUiStringTranslationDto {
  return {
    language: entry.language as AppLanguage,
    value: entry.value,
  };
}

export function toAppUiStringDto(
  record: AppUiStringWithRelations,
): AppUiStringDto {
  return {
    id: record.id,
    key: record.key,
    lifecycle: record.lifecycle as FeatureLifecycle,
    translations: record.translations.map(mapTranslation),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toAppUiStringDtoList(records: AppUiStringWithRelations[]) {
  return records.map(toAppUiStringDto);
}
