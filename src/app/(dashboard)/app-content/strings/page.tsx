"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Languages,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { LifecycleBadge } from "@/components/app-content/status-badges";
import { useDeleteAppUiString } from "@/hooks/mutations/use-app-content-mutations";
import {
  useAppReleaseConfig,
  useAppUiStrings,
} from "@/hooks/queries/use-app-content";
import {
  APP_LANGUAGES,
  type AppLanguage,
} from "@/lib/i18n/languages";
import { getPreferredTranslation } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { AppUiString } from "@/types/app-content";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function LocaleCoverage({
  translations,
}: {
  translations: AppUiString["translations"];
}) {
  const byLang = useMemo(
    () => new Map(translations.map((entry) => [entry.language, entry.value])),
    [translations],
  );

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {APP_LANGUAGES.map((lang) => {
        const filled = Boolean(byLang.get(lang)?.trim());

        return (
          <span
            key={lang}
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
              filled
                ? "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/25 dark:text-emerald-200"
                : "bg-muted/80 text-muted-foreground ring-1 ring-border/60",
            )}
            title={
              filled
                ? (byLang.get(lang as AppLanguage) ?? "").slice(0, 120)
                : "Missing translation"
            }
          >
            {lang}
          </span>
        );
      })}
    </div>
  );
}

function StringsTableSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-4 px-4 py-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AppUiStringsPage() {
  const { data, isLoading, isError, error, refetch } = useAppUiStrings({
    page: 1,
    limit: 100,
  });
  const { data: releaseData } = useAppReleaseConfig();
  const deleteString = useDeleteAppUiString();
  const askConfirm = useConfirm();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const records = useMemo(
    () =>
      [...(data?.data ?? [])].sort((a, b) => a.key.localeCompare(b.key)),
    [data?.data],
  );

  async function handleDelete(id: string, key: string) {
    const confirmed = await askConfirm({
      title: `Delete UI string "${key}"?`,
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setPendingDeleteId(id);
    try {
      await deleteString.mutateAsync(id);
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            <Link href="/app-content" className="hover:underline">
              App Content
            </Link>
            {" / Strings"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">UI Strings</h1>
          <p className="text-muted-foreground text-sm">
            appContentVersion:{" "}
            {releaseData?.data?.appContentVersion ?? "—"}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/app-content/strings/new" />}
        >
          <Plus className="size-4" />
          Add string
        </Button>
      </div>

      {isLoading ? <StringsTableSkeleton /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load strings</p>
            <p className="text-muted-foreground text-sm">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length === 0 ? (
        <Card className="border-brand-tan/60 border-dashed bg-brand-cream/20">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Type className="text-muted-foreground size-10" />
            <p className="font-medium">No UI strings yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add keys like <code className="text-foreground">btn.plan</code>{" "}
              for the mobile shell.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length > 0 ? (
        <Card className="gap-0 overflow-hidden py-0 shadow-md ring-1 ring-border/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-tan/50 bg-linear-to-r from-brand/8 via-brand-cream/60 to-brand-tan/40">
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Key
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Preview
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    <span className="inline-flex items-center justify-center gap-1">
                      <Languages className="size-3.5" />
                      Locales
                    </span>
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-center text-xs font-semibold tracking-wider uppercase">
                    Lifecycle
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-left text-xs font-semibold tracking-wider uppercase">
                    Updated
                  </th>
                  <th className="text-brand-deep px-4 py-3.5 text-right text-xs font-semibold tracking-wider uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {records.map((record, rowIndex) => {
                  const preferred = getPreferredTranslation(
                    record.translations,
                  );
                  const isDeleting = pendingDeleteId === record.id;

                  return (
                    <tr
                      key={record.id}
                      className={cn(
                        "transition-colors hover:bg-brand-cream/35",
                        rowIndex % 2 === 1 && "bg-muted/15",
                      )}
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <code className="bg-brand-cream/60 text-brand-deep inline-block max-w-[220px] truncate rounded-md px-2 py-1 font-mono text-xs font-semibold ring-1 ring-brand-tan/70">
                          {record.key}
                        </code>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <p className="line-clamp-2 max-w-md text-sm leading-snug">
                          {preferred?.value ?? (
                            <span className="text-muted-foreground italic">
                              No translation yet
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <LocaleCoverage translations={record.translations} />
                      </td>
                      <td className="px-4 py-3.5 text-center align-middle">
                        <div className="flex justify-center">
                          <LifecycleBadge value={record.lifecycle} />
                        </div>
                      </td>
                      <td className="text-muted-foreground px-4 py-3.5 align-middle text-xs whitespace-nowrap">
                        {formatDate(record.updatedAt)}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-brand-tan/80 hover:bg-brand-cream/80"
                            nativeButton={false}
                            render={
                              <Link
                                href={`/app-content/strings/${record.id}/edit`}
                              />
                            }
                            aria-label={`Edit string ${record.key}`}
                          >
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deleteString.isPending}
                            aria-label={`Delete string ${record.key}`}
                            onClick={() =>
                              void handleDelete(record.id, record.key)
                            }
                          >
                            {isDeleting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-brand-tan/40 bg-brand-cream/25 px-4 py-2.5">
            <p className="text-muted-foreground text-xs">
              {records.length} string{records.length === 1 ? "" : "s"} · sorted
              by key · green locale chips have copy
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
