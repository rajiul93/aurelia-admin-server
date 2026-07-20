'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Brain,
  Layers,
  Loader2,
  MapPinned,
  MapPin,
  Pencil,
  Plus,
  Route,
  Trash2,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useDeleteTour } from '@/hooks/mutations/use-tour-mutations';
import { useTours } from '@/hooks/queries/use-tours';
import { APP_LANGUAGES } from '@/lib/i18n/languages';
import { getPreferredAudienceTranslation } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';
import type { PublishStatus, TourListItem } from '@/types/tour';

const CARD_SHELL =
  'group relative gap-0 overflow-hidden p-0 py-0 shadow-lg ring-1 ring-border/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:ring-brand-tan/55';

const publishStatusLabels: Record<PublishStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

function publishStatusStyle(status: PublishStatus) {
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
        badge:
          'bg-primary/10 text-primary ring-1 ring-primary/25',
        dot: 'bg-primary',
      };
  }
}

function PublishStatusBadge({ status }: { status: PublishStatus }) {
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

function LocaleCoverage({
  translations,
}: {
  translations: TourListItem['translations'];
}) {
  const filledByLang = useMemo(() => {
    const set = new Set<string>();
    for (const entry of translations) {
      if (entry.title?.trim()) {
        set.add(entry.language);
      }
    }
    return set;
  }, [translations]);

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {APP_LANGUAGES.map((lang) => {
        const filled = filledByLang.has(lang);
        return (
          <span
            key={lang}
            className={cn(
              'rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
              filled
                ? 'bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/25 dark:text-emerald-200'
                : 'bg-muted/80 text-muted-foreground ring-1 ring-border/60',
            )}
          >
            {lang}
          </span>
        );
      })}
    </div>
  );
}

function TourCardSkeleton() {
  return (
    <Card className={cn(CARD_SHELL, 'hover:translate-y-0 hover:shadow-lg')}>
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      <CardFooter className="flex flex-col items-center gap-3 border-t border-brand-tan/30 bg-linear-to-r from-brand/5 via-brand-cream/40 to-brand-tan/20 px-4 py-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </CardFooter>
    </Card>
  );
}

function TourHero({
  coverUrl,
  title,
  status,
}: {
  coverUrl?: string | null;
  title: string;
  status: PublishStatus;
}) {
  const stripe = publishStatusStyle(status).stripe;

  if (coverUrl) {
    return (
      <>
        <div className={cn('h-1 bg-linear-to-r', stripe)} />
        <div className="relative aspect-16/10 w-full overflow-hidden bg-brand-deep/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={title}
            className="size-full object-cover transition duration-700 ease-out group-hover:scale-105"
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-brand-deep/85 via-brand-deep/30 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-10">
            <p className="line-clamp-2 text-lg leading-tight font-semibold tracking-tight text-white drop-shadow-md">
              {title}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={cn('h-1 bg-linear-to-r', stripe)} />
      <div className="relative aspect-16/10 w-full overflow-hidden bg-linear-to-br from-primary/12 via-brand-cream/90 to-brand-tan/50">
        <div className="relative flex size-full flex-col items-center justify-center gap-2 px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-background/50 shadow-sm ring-1 ring-brand-tan/40 backdrop-blur-sm">
            <MapPinned className="text-brand-deep/70 size-7" />
          </div>
          <p className="text-brand-deep line-clamp-2 text-lg leading-snug font-semibold tracking-tight">
            {title}
          </p>
        </div>
      </div>
    </>
  );
}

function TourActionButton({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-brand-tan/70 bg-background/60 hover:bg-brand-cream/80 h-8 flex-1 text-xs"
      nativeButton={false}
      render={<Link href={href} />}
    >
      <Icon className="size-3.5 shrink-0" />
      {label}
    </Button>
  );
}

export function TourList() {
  const { data, isLoading, isError, error, refetch } = useTours({
    page: 1,
    limit: 100,
  });
  const deleteTour = useDeleteTour();
  const askConfirm = useConfirm();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const tours = data?.data ?? [];

  async function handleDelete(id: string) {
    const confirmed = await askConfirm({
      title: 'Delete this tour?',
      description: 'This action cannot be undone.',
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(id);
    try {
      await deleteTour.mutateAsync(id);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button nativeButton={false} render={<Link href="/tours/new" />}>
          <Plus className="size-4" />
          Create tour
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <TourCardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40 shadow-md">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load tours</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error
                ? error.message
                : 'Something went wrong while fetching tours.'}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && tours.length === 0 ? (
        <Card className="border-brand-tan/60 overflow-hidden border-dashed bg-linear-to-br from-brand-cream/30 via-background to-brand-tan/15 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-cream/60 ring-1 ring-brand-tan/50">
              <MapPinned className="text-brand-deep size-8" />
            </div>
            <p className="text-lg font-semibold tracking-tight">No tours yet</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Create your first tour with floors, spots, media, and routes.
            </p>
            <Button
              className="mt-2"
              nativeButton={false}
              render={<Link href="/tours/new" />}
            >
              <Plus className="size-4" />
              Create tour
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && tours.length > 0 ? (
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => {
              const preferred = getPreferredAudienceTranslation(
                tour.translations,
              );
              const displayTitle = preferred?.title || tour.slug;
              const isDeleting = pendingDeleteId === tour.id;
              const hasCover = Boolean(tour.coverMedia?.url);

              return (
                <Card key={tour.id} className={CARD_SHELL}>
                  <TourHero
                    coverUrl={tour.coverMedia?.url}
                    title={displayTitle}
                    status={tour.publishStatus}
                  />

                  <CardFooter className="flex flex-col items-center gap-3.5 border-t border-brand-tan/35 bg-linear-to-r from-brand/6 via-brand-cream/45 to-brand-tan/25 px-4 py-4 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <PublishStatusBadge status={tour.publishStatus} />
                      <Badge
                        variant="outline"
                        className="border-brand-tan/50 bg-background/70 text-brand-deep font-medium"
                      >
                        <MapPin className="mr-1 size-3" />
                        {tour.spotCount} spot{tour.spotCount === 1 ? '' : 's'}
                      </Badge>
                    </div>

                    {!hasCover ? (
                      <p className="text-muted-foreground line-clamp-2 max-w-full text-xs leading-relaxed">
                        {preferred?.description || 'No description yet.'}
                      </p>
                    ) : null}

                    <Badge
                      variant="outline"
                      className="border-brand-tan/50 bg-background/70 text-brand-deep max-w-full truncate font-mono text-[11px]"
                      title={tour.slug}
                    >
                      /{tour.slug}
                    </Badge>

                    <LocaleCoverage translations={tour.translations} />

                    <div className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-3">
                      <TourActionButton
                        href={`/tours/${tour.id}/edit`}
                        icon={Pencil}
                        label="Edit"
                      />
                      <TourActionButton
                        href={`/tours/${tour.id}/floors`}
                        icon={Layers}
                        label="Floors"
                      />
                      <TourActionButton
                        href={`/tours/${tour.id}/spots`}
                        icon={MapPin}
                        label="Spots"
                      />
                      <TourActionButton
                        href={`/tours/${tour.id}/route`}
                        icon={Route}
                        label="Route"
                      />
                      <TourActionButton
                        href={`/tours/${tour.id}/ai-knowledge`}
                        icon={Brain}
                        label="AI"
                      />
                      <TourActionButton
                        href={`/tours/${tour.id}/hosts`}
                        icon={Users}
                        label="Hosts"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={deleteTour.isPending}
                      onClick={() => void handleDelete(tour.id)}
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      Delete tour
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}
