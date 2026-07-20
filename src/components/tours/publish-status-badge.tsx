import { cn } from '@/lib/utils';
import type { PublishStatus } from '@/types/tour';

export const publishStatusLabels: Record<PublishStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export function publishStatusStyle(status: PublishStatus) {
  switch (status) {
    case 'PUBLISHED':
      return {
        stripe: 'from-emerald-500 via-emerald-400 to-brand-cream',
        badge:
          'bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/30 dark:text-emerald-100',
        dot: 'bg-emerald-500',
      };
    case 'REVIEW':
      return {
        stripe: 'from-amber-500 via-amber-400 to-brand-cream',
        badge:
          'bg-amber-500/15 text-amber-950 ring-1 ring-amber-500/35 dark:text-amber-100',
        dot: 'bg-amber-500',
      };
    case 'ARCHIVED':
      return {
        stripe: 'from-slate-400 via-slate-300 to-brand-cream',
        badge:
          'bg-slate-500/12 text-slate-700 ring-1 ring-slate-400/30 dark:text-slate-300',
        dot: 'bg-slate-400',
      };
    default:
      return {
        stripe: 'from-primary/80 via-brand-tan to-brand-cream',
        badge: 'bg-primary/10 text-primary ring-1 ring-primary/25',
        dot: 'bg-primary',
      };
  }
}

export function PublishStatusBadge({ status }: { status: PublishStatus }) {
  const style = publishStatusStyle(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase',
        style.badge,
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} />
      {publishStatusLabels[status]}
    </span>
  );
}

export const TOUR_PANEL_CARD =
  'gap-0 overflow-hidden p-0 py-0 shadow-md ring-1 ring-border/80';

export const TOUR_PANEL_HEADER =
  'border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40';
