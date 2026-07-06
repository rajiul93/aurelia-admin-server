"use client";

import {
  AUDIENCE_TYPES,
  AUDIENCE_LABELS,
  type AudienceType,
} from "@/lib/i18n/audiences";
import { cn } from "@/lib/utils";

type AudienceTabsProps = {
  value: AudienceType;
  onChange: (audience: AudienceType) => void;
  className?: string;
};

export function AudienceTabs({
  value,
  onChange,
  className,
}: AudienceTabsProps) {
  return (
    <div
      className={cn(
        "bg-muted flex flex-wrap gap-1 rounded-lg p-1",
        className,
      )}
    >
      {AUDIENCE_TYPES.map((audience) => {
        const active = audience === value;

        return (
          <button
            key={audience}
            type="button"
            onClick={() => onChange(audience)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {AUDIENCE_LABELS[audience]}
          </button>
        );
      })}
    </div>
  );
}
