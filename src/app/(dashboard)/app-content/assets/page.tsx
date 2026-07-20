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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useDeleteAppAsset } from "@/hooks/mutations/use-app-content-mutations";
import {
  useAppAssets,
  useAppReleaseConfig,
} from "@/hooks/queries/use-app-content";

export default function AppAssetsPage() {
  const { data, isLoading, isError, error, refetch } = useAppAssets({
    page: 1,
    limit: 100,
  });
  const { data: releaseData } = useAppReleaseConfig();
  const deleteAsset = useDeleteAppAsset();
  const askConfirm = useConfirm();
  const records = data?.data ?? [];

  async function handleDelete(id: string, key: string) {
    const confirmed = await askConfirm({
      title: `Delete app asset "${key}"?`,
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    await deleteAsset.mutateAsync(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            <Link href="/app-content" className="hover:underline">
              App Content
            </Link>
            {" / Assets"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">App Assets</h1>
          <p className="text-muted-foreground text-sm">
            appContentVersion:{" "}
            {releaseData?.data?.appContentVersion ?? "—"}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/app-content/assets/new" />}
        >
          <Plus className="size-4" />
          Add asset
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load assets</p>
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
            <p className="font-medium">No app assets yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload backgrounds and UI images for the mobile shell.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {records.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <div className="bg-muted relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={record.media.url}
                  alt={record.key}
                  className="size-full object-cover"
                />
              </div>
              <CardHeader className="space-y-2 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {record.key}
                  </Badge>
                  {record.timeOfDay ? (
                    <Badge variant="secondary">{record.timeOfDay}</Badge>
                  ) : null}
                  <Badge variant="outline">{record.lifecycle}</Badge>
                </div>
                <CardTitle className="text-sm font-normal">
                  {record.media.originalName}
                </CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link href={`/app-content/assets/${record.id}/edit`} />
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
                  disabled={deleteAsset.isPending}
                  onClick={() => void handleDelete(record.id, record.key)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
