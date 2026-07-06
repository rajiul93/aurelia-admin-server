"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteAppUiString } from "@/hooks/mutations/use-app-content-mutations";
import {
  useAppReleaseConfig,
  useAppUiStrings,
} from "@/hooks/queries/use-app-content";
import { getPreferredTranslation } from "@/lib/i18n/translations";

export default function AppUiStringsPage() {
  const { data, isLoading, isError, error, refetch } = useAppUiStrings({
    page: 1,
    limit: 100,
  });
  const { data: releaseData } = useAppReleaseConfig();
  const deleteString = useDeleteAppUiString();
  const records = data?.data ?? [];

  async function handleDelete(id: string, key: string) {
    if (!window.confirm(`Delete UI string "${key}"?`)) {
      return;
    }

    await deleteString.mutateAsync(id);
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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

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
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="font-medium">No UI strings yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Add keys like <code>btn.plan</code> for the mobile shell.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length > 0 ? (
        <div className="grid gap-4">
          {records.map((record) => {
            const preferred = getPreferredTranslation(record.translations);

            return (
              <Card key={record.id}>
                <CardHeader className="space-y-2 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {record.key}
                    </Badge>
                    <Badge variant="secondary">{record.lifecycle}</Badge>
                  </div>
                  <CardTitle className="text-base font-normal">
                    {preferred?.value}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="flex justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link href={`/app-content/strings/${record.id}/edit`} />
                    }
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deleteString.isPending}
                    onClick={() => void handleDelete(record.id, record.key)}
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
