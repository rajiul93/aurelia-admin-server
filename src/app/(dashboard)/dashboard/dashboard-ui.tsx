import type { ReactNode } from "react";

export const STAT_CARD_SHELL =
  "group relative gap-0 overflow-hidden border-0 p-0 py-0 shadow-lg ring-1 ring-border/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl";

export function SectionHeading({
  title,
  badge,
}: {
  title: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-brand-tan/40 pb-2">
      <h2 className="text-brand-deep text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {badge}
    </div>
  );
}
