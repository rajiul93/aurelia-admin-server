'use client';

import Link from 'next/link';
import { Layers, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteTour } from '@/hooks/mutations/use-tour-mutations';
import { useTours } from '@/hooks/queries/use-tours';
import { APP_LANGUAGES, LANGUAGE_LABELS } from '@/lib/i18n/languages';
import { getPreferredAudienceTranslation } from '@/lib/i18n/translations';
import type { PublishStatus } from '@/types/tour';

const publishStatusLabels: Record<PublishStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const publishStatusVariant: Record<
  PublishStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  DRAFT: 'secondary',
  REVIEW: 'outline',
  PUBLISHED: 'default',
  ARCHIVED: 'destructive',
};

export function TourList() {
  const { data, isLoading, isError, error, refetch } = useTours({
    page: 1,
    limit: 100,
  });
  const deleteTour = useDeleteTour();

  const tours = data?.data ?? [];

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'Delete this tour? This action cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    await deleteTour.mutateAsync(id);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">All Tours</h2>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Each tour includes metadata, spots, media, and FAQs in English,
            Spanish, and French.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/tours/new" />}
        >
          <Plus className="size-4" />
          Create tour
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="space-y-4 p-6">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40">
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No tours yet</p>
            <p className="text-muted-foreground text-sm">
              Create your first tour with spots, media, and FAQs.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && tours.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-1 xl:grid-cols-2">
          {tours.map((tour) => {
            const preferred = getPreferredAudienceTranslation(
              tour.translations,
            );

            return (
              <Card
                key={tour.id}
                className="flex h-full flex-col overflow-hidden border border-border/80 shadow-sm"
              >
                {tour.coverMedia?.url ? (
                  <div className="relative -mt-(--card-spacing) aspect-video w-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tour.coverMedia.url}
                      alt={preferred?.title ?? tour.slug}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}

                <CardHeader className="space-y-4 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={publishStatusVariant[tour.publishStatus]}>
                      {publishStatusLabels[tour.publishStatus]}
                    </Badge>
                    <Badge variant="outline">{tour.spots.length} spots</Badge>
                    {APP_LANGUAGES.map((language) => (
                      <Badge
                        key={language}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {LANGUAGE_LABELS[language]}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-base leading-snug font-semibold tracking-tight">
                    {preferred?.title || tour.slug}
                  </CardTitle>
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {preferred?.description || 'No description yet.'}
                  </p>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  <p className="text-muted-foreground text-xs">
                    Slug: <span className="font-mono">{tour.slug}</span>
                  </p>
                </CardContent>

                <CardFooter className="mt-auto flex items-center justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/tours/${tour.id}/edit`} />}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/tours/${tour.id}/floors`} />}
                  >
                    <Layers className="size-4" />
                    Floors
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/tours/${tour.id}/spots`} />}
                  >
                    Spots
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/tours/${tour.id}/route`} />}
                  >
                    Route
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/tours/${tour.id}/ai-knowledge`} />}
                  >
                    AI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/tours/${tour.id}/hosts`} />}
                  >
                    <Users className="size-4" />
                    Hosts
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleteTour.isPending}
                    onClick={() => void handleDelete(tour.id)}
                  >
                    <Trash2 className="size-4" />
                    Delete
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
