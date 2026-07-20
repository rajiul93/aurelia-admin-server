"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  ChevronLeft,
  Layers,
  MapPin,
  Pencil,
  Route,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PublishStatusBadge } from "@/components/tours/publish-status-badge";
import { getPreferredAudienceTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { TourDetail } from "@/types/tour";

const NAV_ITEMS: {
  segment: string;
  href: (tourId: string) => string;
  icon: LucideIcon;
  label: string;
  match: (pathname: string, tourId: string) => boolean;
}[] = [
  {
    segment: "edit",
    href: (id) => `/tours/${id}/edit`,
    icon: Pencil,
    label: "Edit",
    match: (path, id) => path === `/tours/${id}/edit`,
  },
  {
    segment: "floors",
    href: (id) => `/tours/${id}/floors`,
    icon: Layers,
    label: "Floors",
    match: (path, id) => path.startsWith(`/tours/${id}/floors`),
  },
  {
    segment: "spots",
    href: (id) => `/tours/${id}/spots`,
    icon: MapPin,
    label: "Spots",
    match: (path, id) => path.startsWith(`/tours/${id}/spots`),
  },
  {
    segment: "route",
    href: (id) => `/tours/${id}/route`,
    icon: Route,
    label: "Route",
    match: (path, id) => path.startsWith(`/tours/${id}/route`),
  },
  {
    segment: "ai-knowledge",
    href: (id) => `/tours/${id}/ai-knowledge`,
    icon: Brain,
    label: "AI knowledge",
    match: (path, id) => path.startsWith(`/tours/${id}/ai-knowledge`),
  },
  {
    segment: "hosts",
    href: (id) => `/tours/${id}/hosts`,
    icon: Users,
    label: "Hosts",
    match: (path, id) => path.startsWith(`/tours/${id}/hosts`),
  },
];

export function getTourWorkspaceSectionLabel(
  pathname: string,
  tourId: string,
): string {
  const base = `/tours/${tourId}`;

  if (pathname === `${base}/edit`) {
    return "Edit";
  }
  if (pathname === `${base}/floors`) {
    return "Floors";
  }
  if (pathname === `${base}/route`) {
    return "Route";
  }
  if (pathname === `${base}/hosts`) {
    return "Hosts";
  }
  if (pathname === `${base}/ai-knowledge`) {
    return "AI knowledge";
  }
  if (pathname === `${base}/ai-knowledge/new`) {
    return "AI knowledge / New";
  }
  if (/^\/tours\/[^/]+\/ai-knowledge\/[^/]+\/edit$/.test(pathname)) {
    return "AI knowledge / Edit";
  }
  if (pathname === `${base}/spots`) {
    return "Spots";
  }
  if (pathname === `${base}/spots/new`) {
    return "Spots / New";
  }
  if (/^\/tours\/[^/]+\/spots\/[^/]+\/edit$/.test(pathname)) {
    return "Spots / Edit";
  }
  if (/^\/tours\/[^/]+\/spots\/[^/]+\/media$/.test(pathname)) {
    return "Spots / Media";
  }
  if (/^\/tours\/[^/]+\/spots\/[^/]+\/faqs$/.test(pathname)) {
    return "Spots / FAQs";
  }

  return "Tour";
}

function sectionDescription(sectionLabel: string): string | null {
  if (sectionLabel === "Edit") {
    return "Update catalog metadata below. Use the publish workflow when content is ready, then manage floors, spots, and routes from the shortcuts.";
  }
  if (sectionLabel.startsWith("Spots")) {
    return "Manage stops for this tour. Media and FAQs live on each spot’s pages.";
  }
  if (sectionLabel === "Floors") {
    return "Add floors, cover images, and transitions for multi-level venues.";
  }
  if (sectionLabel === "Route") {
    return "Build walking paths and footprints per floor.";
  }
  if (sectionLabel.startsWith("AI knowledge")) {
    return "Knowledge entries power the mobile assistant for this tour.";
  }
  if (sectionLabel === "Hosts") {
    return "On-site staff cards shown on the published tour map.";
  }
  return null;
}

function TourNavChip({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-8 border-brand-tan/60 text-xs",
        active
          ? "border-primary/40 bg-brand-cream/90 font-semibold text-brand-deep ring-1 ring-primary/20"
          : "bg-background/70 hover:bg-brand-cream/80",
      )}
      nativeButton={false}
      render={<Link href={href} />}
    >
      <Icon className="size-3.5" />
      {label}
    </Button>
  );
}

export function TourWorkspaceHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-linear-to-br from-brand/10 via-brand-cream/80 to-brand-tan/40 p-6 shadow-md ring-1 ring-brand-tan/50 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <Skeleton className="aspect-video w-full max-w-[200px] rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-full max-w-lg" />
        </div>
      </div>
    </div>
  );
}

type TourWorkspaceHeaderProps = {
  tourId: string;
  tour: TourDetail;
  sectionLabel: string;
};

export function TourWorkspaceHeader({
  tourId,
  tour,
  sectionLabel,
}: TourWorkspaceHeaderProps) {
  const pathname = usePathname();
  const preferred = getPreferredAudienceTranslation(tour.translations);
  const displayTitle = preferred?.title || tour.slug;
  const description = sectionDescription(sectionLabel);

  return (
    <div className="overflow-hidden rounded-2xl bg-linear-to-br from-brand/10 via-brand-cream/80 to-brand-tan/40 shadow-md ring-1 ring-brand-tan/50">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:p-8">
        <div className="relative shrink-0 overflow-hidden rounded-xl ring-1 ring-brand-tan/60">
          {tour.coverMedia?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tour.coverMedia.url}
              alt=""
              className="aspect-video w-full max-w-[220px] object-cover md:max-w-[200px]"
            />
          ) : (
            <div className="bg-muted flex aspect-video w-full max-w-[220px] items-center justify-center md:max-w-[200px]">
              <MapPin className="text-muted-foreground size-10" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              <Link
                href="/tours"
                className="hover:text-foreground inline-flex items-center gap-1 hover:underline"
              >
                <ChevronLeft className="size-4" />
                Tours
              </Link>
              <span className="mx-1.5">/</span>
              <span>{sectionLabel}</span>
            </p>
            <h1 className="text-brand-deep text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              {displayTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <PublishStatusBadge status={tour.publishStatus} />
              <Badge
                variant="outline"
                className="border-brand-tan/50 bg-background/60 font-mono text-[11px]"
              >
                /{tour.slug}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                bundle v{tour.tourBundleVersion}
              </Badge>
            </div>
            {description ? (
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => (
              <TourNavChip
                key={item.segment}
                href={item.href(tourId)}
                icon={item.icon}
                label={item.label}
                active={item.match(pathname, tourId)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
