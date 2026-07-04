"use client";

import {
  APP_LANGUAGES,
  LANGUAGE_LABELS,
  type AppLanguage,
} from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";

type LanguageTabsProps = {
  value: AppLanguage;
  onChange: (language: AppLanguage) => void;
  className?: string;
};

export function LanguageTabs({
  value,
  onChange,
  className,
}: LanguageTabsProps) {
  return (
    <div
      className={cn(
        "bg-muted flex flex-wrap gap-1 rounded-lg p-1",
        className,
      )}
    >
      {APP_LANGUAGES.map((language) => {
        const active = language === value;

        return (
          <button
            key={language}
            type="button"
            onClick={() => onChange(language)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {LANGUAGE_LABELS[language]}
          </button>
        );
      })}
    </div>
  );
}
