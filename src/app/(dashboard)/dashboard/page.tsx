"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  MapPinned,
  Shield,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppReleaseConfig } from "@/hooks/queries/use-app-content";
import { useTours } from "@/hooks/queries/use-tours";
import { useTourAccessList } from "@/hooks/queries/use-tour-access";
import { useAuthStore } from "@/store/auth-store";
import { hasMinimumRole } from "@/lib/auth/rbac";
import { getNavItemsForRole, type NavItem } from "@/utils/navigation";
import {
  getSectionsForRole,
  type HandbookItem,
  type HandbookSection,
} from "@/content/dashboard-handbook";
import type { StaffRole } from "@/types/auth";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const STAT_CARD_SHELL =
  "group relative gap-0 overflow-hidden border-0 p-0 py-0 shadow-lg ring-1 ring-border/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl";

const QUICK_ACTION_ACCENTS = [
  {
    iconBg: "bg-primary/15 ring-primary/25",
    icon: "text-primary",
    bar: "from-primary/80 via-primary/40 to-transparent",
  },
  {
    iconBg: "bg-violet-500/15 ring-violet-500/25",
    icon: "text-violet-700 dark:text-violet-300",
    bar: "from-violet-500/70 via-violet-400/30 to-transparent",
  },
  {
    iconBg: "bg-emerald-500/15 ring-emerald-500/25",
    icon: "text-emerald-800 dark:text-emerald-300",
    bar: "from-emerald-500/70 via-emerald-400/30 to-transparent",
  },
  {
    iconBg: "bg-sky-500/15 ring-sky-500/25",
    icon: "text-sky-800 dark:text-sky-300",
    bar: "from-sky-500/70 via-sky-400/30 to-transparent",
  },
  {
    iconBg: "bg-amber-500/15 ring-amber-500/25",
    icon: "text-amber-900 dark:text-amber-200",
    bar: "from-amber-500/70 via-amber-400/30 to-transparent",
  },
  {
    iconBg: "bg-rose-500/15 ring-rose-500/25",
    icon: "text-rose-800 dark:text-rose-300",
    bar: "from-rose-500/70 via-rose-400/30 to-transparent",
  },
] as const;

const HANDBOOK_SECTION_META: Record<
  string,
  { icon: LucideIcon; accent: string; iconClass: string }
> = {
  "platform-overview": {
    icon: LayoutDashboard,
    accent: "bg-primary/10",
    iconClass: "text-primary",
  },
  "roles-permissions": {
    icon: Shield,
    accent: "bg-violet-500/10",
    iconClass: "text-violet-700 dark:text-violet-300",
  },
  "grant-access": {
    icon: KeyRound,
    accent: "bg-emerald-500/10",
    iconClass: "text-emerald-700 dark:text-emerald-300",
  },
  "author-tour": {
    icon: MapPinned,
    accent: "bg-sky-500/10",
    iconClass: "text-sky-700 dark:text-sky-300",
  },
  "release-config": {
    icon: Smartphone,
    accent: "bg-amber-500/10",
    iconClass: "text-amber-800 dark:text-amber-200",
  },
  "support-content": {
    icon: CircleHelp,
    accent: "bg-rose-500/10",
    iconClass: "text-rose-700 dark:text-rose-300",
  },
  troubleshooting: {
    icon: Wrench,
    accent: "bg-orange-500/10",
    iconClass: "text-orange-700 dark:text-orange-300",
  },
};

function StatMeter({
  value,
  max,
  gradient,
}: {
  value: number;
  max: number;
  gradient: string;
}) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;

  return (
    <div className="bg-muted/80 mt-3 h-1.5 w-full overflow-hidden rounded-full ring-1 ring-border/50">
      <div
        className={cn("h-full rounded-full bg-linear-to-r", gradient)}
        style={{ width: `${Math.max(ratio * 100, value > 0 ? 8 : 0)}%` }}
      />
    </div>
  );
}

function ToursStatCard() {
  const { data, isLoading, isError } = useTours({ page: 1, limit: 100 });
  const tours = data?.data ?? [];
  const published = tours.filter((t) => t.publishStatus === "PUBLISHED").length;
  const total = tours.length;

  return (
    <Card className={cn(STAT_CARD_SHELL, "hover:ring-sky-500/40")}>
      <div className="h-1 bg-linear-to-r from-sky-500 via-primary to-brand-tan" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-2">
        <div>
          <CardTitle className="text-brand-deep text-xs font-semibold tracking-wider uppercase">
            Tours
          </CardTitle>
          <CardDescription className="text-xs">Published vs total</CardDescription>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/12 ring-1 ring-sky-500/25">
          <MapPinned className="size-5 text-sky-700 dark:text-sky-300" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading && <Skeleton className="h-9 w-24" />}
        {isError && (
          <p className="text-destructive text-sm">Could not load tours</p>
        )}
        {!isLoading && !isError && (
          <>
            <p className="text-brand-deep text-3xl font-bold tabular-nums tracking-tight">
              {published}
              <span className="text-muted-foreground text-lg font-normal">
                {" "}
                / {total}
              </span>
            </p>
            <StatMeter
              value={published}
              max={total || 1}
              gradient="from-sky-500 to-primary"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AccessGrantsStatCard() {
  const { data, isLoading, isError } = useTourAccessList({
    page: 1,
    limit: 100,
  });
  const grants = data?.data ?? [];
  const active = grants.filter((g) => g.status === "ACTIVE").length;
  const total = grants.length;

  return (
    <Card className={cn(STAT_CARD_SHELL, "hover:ring-emerald-500/40")}>
      <div className="h-1 bg-linear-to-r from-emerald-500 via-emerald-400 to-brand-cream" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-2">
        <div>
          <CardTitle className="text-brand-deep text-xs font-semibold tracking-wider uppercase">
            Access grants
          </CardTitle>
          <CardDescription className="text-xs">Active vs total</CardDescription>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-500/25">
          <KeyRound className="size-5 text-emerald-700 dark:text-emerald-300" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading && <Skeleton className="h-9 w-24" />}
        {isError && (
          <p className="text-destructive text-sm">Could not load grants</p>
        )}
        {!isLoading && !isError && (
          <>
            <p className="text-brand-deep text-3xl font-bold tabular-nums tracking-tight">
              {active}
              <span className="text-muted-foreground text-lg font-normal">
                {" "}
                / {total}
              </span>
            </p>
            <StatMeter
              value={active}
              max={total || 1}
              gradient="from-emerald-500 to-emerald-600"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AppContentVersionCard() {
  const { data, isLoading, isError } = useAppReleaseConfig();
  const config = data?.data;

  return (
    <Card className={cn(STAT_CARD_SHELL, "hover:ring-amber-500/40")}>
      <div className="h-1 bg-linear-to-r from-amber-500 via-brand-tan to-brand-cream" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-5 pb-2">
        <div>
          <CardTitle className="text-brand-deep text-xs font-semibold tracking-wider uppercase">
            App content
          </CardTitle>
          <CardDescription className="text-xs">Remote sync version</CardDescription>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/12 ring-1 ring-amber-500/25">
          <Smartphone className="size-5 text-amber-800 dark:text-amber-200" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {isLoading && <Skeleton className="h-9 w-20" />}
        {isError && (
          <p className="text-destructive text-sm">Could not load config</p>
        )}
        {!isLoading && !isError && (
          <>
            <p className="text-brand-deep text-3xl font-bold tabular-nums tracking-tight">
              v{config?.appContentVersion ?? "—"}
            </p>
            {config?.publishStatus ? (
              <Badge
                variant="outline"
                className="border-brand-tan/60 bg-brand-cream/40 text-brand-deep mt-2 font-medium"
              >
                {config.publishStatus}
              </Badge>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  item,
  index,
}: {
  item: NavItem;
  index: number;
}) {
  if (!item.href) {
    return null;
  }

  const accent = QUICK_ACTION_ACCENTS[index % QUICK_ACTION_ACCENTS.length]!;

  return (
    <Link href={item.href}>
      <Card
        className={cn(
          STAT_CARD_SHELL,
          "h-full hover:ring-brand-tan/60",
        )}
      >
        <div
          className={cn("h-0.5 bg-linear-to-r", accent.bar)}
          aria-hidden
        />
        <CardHeader className="gap-3 px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                accent.iconBg,
              )}
            >
              <item.icon className={cn("size-5", accent.icon)} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold tracking-tight">
                {item.title}
              </CardTitle>
            </div>
            <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardHeader>
        {item.description ? (
          <CardContent className="px-4 pt-0 pb-4">
            <CardDescription className="line-clamp-2 text-xs leading-relaxed">
              {item.description}
            </CardDescription>
          </CardContent>
        ) : (
          <div className="pb-4" />
        )}
      </Card>
    </Link>
  );
}

function HandbookItemRenderer({ item }: { item: HandbookItem }) {
  switch (item.type) {
    case "paragraph":
      return (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {item.content as string}
        </p>
      );

    case "steps":
      return (
        <ol className="space-y-2.5">
          {(item.content as string[]).map((step, i) => (
            <li
              key={i}
              className="text-muted-foreground flex gap-3 text-sm leading-relaxed"
            >
              <span className="bg-primary/12 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-primary/20">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      );

    case "checklist":
      return (
        <ul className="space-y-2">
          {(item.content as string[]).map((check, i) => (
            <li
              key={i}
              className="text-muted-foreground flex items-start gap-2 text-sm"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span>{check}</span>
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-lg ring-1 ring-border/80">
          <table className="w-full min-w-0 border-collapse text-sm">
            <thead>
              <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                {item.columns?.map((col, i) => (
                  <th
                    key={i}
                    className="text-brand-deep px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {item.rows?.map((row, ri) => (
                <tr
                  key={ri}
                  className={cn(
                    "transition-colors hover:bg-brand-cream/30",
                    ri % 2 === 1 && "bg-muted/15",
                  )}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="text-muted-foreground px-3 py-2.5 text-sm"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "tip":
      return (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-300/50 bg-linear-to-r from-amber-50/90 to-brand-cream/50 px-3.5 py-3 dark:border-amber-800/40 dark:from-amber-950/30 dark:to-brand-deep/10">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-100">
            {item.content as string}
          </p>
        </div>
      );

    default:
      return null;
  }
}

function HandbookSectionCard({ section }: { section: HandbookSection }) {
  const meta = HANDBOOK_SECTION_META[section.id] ?? {
    icon: BookOpen,
    accent: "bg-primary/10",
    iconClass: "text-primary",
  };
  const SectionIcon = meta.icon;

  return (
    <AccordionItem
      value={section.id}
      className="border-border/50 px-4 md:px-6"
    >
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex items-center gap-3 pr-2">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-border/60",
              meta.accent,
            )}
          >
            <SectionIcon className={cn("size-4", meta.iconClass)} />
          </div>
          <span className="text-brand-deep font-semibold tracking-tight">
            {section.title}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-5">
        <div className="space-y-4 border-l-2 border-brand-tan/50 pl-4 md:pl-5">
          {section.items.map((item, i) => (
            <HandbookItemRenderer key={i} item={item} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function RoleBadge({ role }: { role: StaffRole }) {
  const styles: Record<
    StaffRole,
    { className: string; dot: string }
  > = {
    SUPERADMIN: {
      className:
        "bg-primary/15 text-primary ring-1 ring-primary/30",
      dot: "bg-primary",
    },
    ADMIN: {
      className:
        "bg-violet-500/12 text-violet-900 ring-1 ring-violet-500/30 dark:text-violet-100",
      dot: "bg-violet-500",
    },
    MANAGER: {
      className:
        "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/30 dark:text-emerald-100",
      dot: "bg-emerald-500",
    },
  };
  const style = styles[role];

  return (
    <span
      className={cn(
        "ml-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
        style.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {role}
    </span>
  );
}

function SectionHeading({
  title,
  badge,
}: {
  title: string;
  badge?: React.ReactNode;
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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role ?? null;
  const isAdmin = role ? hasMinimumRole(role, "ADMIN") : false;

  const navItems = role ? getNavItemsForRole(role) : [];
  const quickActions = navItems
    .flatMap((item) => (item.children ? item.children : [item]))
    .filter((item) => item.href && item.href !== "/dashboard")
    .slice(0, 6);

  const handbookSections = role ? getSectionsForRole(role) : [];

  return (
    <div className="space-y-10">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand/10 via-brand-cream/80 to-brand-tan/40 px-6 py-8 shadow-md ring-1 ring-brand-tan/50 md:px-8">
        <div
          className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full bg-brand-tan/40 blur-2xl"
          aria-hidden
        />
        <div className="relative space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <Sparkles className="text-primary size-5" />
            <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Aurelia Staff Portal
            </span>
          </div>
          <div className="flex flex-wrap items-center">
            <h1 className="text-brand-deep text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            {role ? <RoleBadge role={role} /> : null}
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Manage tours, access grants, and app content. Open a quick action
            below or browse the staff handbook for workflows.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading title="At a glance" />
        <div
          className={cn(
            "grid gap-5",
            isAdmin ? "md:grid-cols-3" : "md:grid-cols-2",
          )}
        >
          <ToursStatCard />
          {isAdmin ? <AccessGrantsStatCard /> : null}
          <AppContentVersionCard />
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading title="Quick actions" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((item, index) => (
            <QuickActionCard key={item.href} item={item} index={index} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeading
          title="Staff handbook"
          badge={
            <Badge
              variant="outline"
              className="border-brand-tan/60 bg-brand-cream/50 text-brand-deep text-[10px] font-semibold"
            >
              {handbookSections.length} sections
            </Badge>
          }
        />
        <Card className="gap-0 overflow-hidden p-0 py-0 shadow-lg ring-1 ring-border/80">
          <div className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40 px-4 py-3 md:px-6">
            <p className="text-brand-deep text-xs font-semibold tracking-wider uppercase">
              Operational guides
            </p>
          </div>
          <CardContent className="p-0 pt-0">
            <Accordion className="divide-y divide-border/50">
              {handbookSections.map((section) => (
                <HandbookSectionCard key={section.id} section={section} />
              ))}
            </Accordion>
          </CardContent>
        </Card>
        {!isAdmin ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-sky-300/50 bg-linear-to-r from-sky-50/80 to-brand-cream/30 px-4 py-3 dark:border-sky-800/40 dark:from-sky-950/25">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
            <p className="text-sm leading-relaxed text-sky-900 dark:text-sky-100">
              Some handbook sections (Access Mgmt, Subscriptions) are only
              visible to Admin and Superadmin roles.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
