"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppAsset } from "@/hooks/queries/use-app-content";
import { AssetForm } from "../../asset-form";

export default function EditAppAssetPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useAppAsset(params.id);
  const record = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="space-y-4">
        <p className="font-medium">Could not load app asset</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Not found."}
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/app-content/assets" />}
        >
          Back to assets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit App Asset</h1>
        <p className="text-muted-foreground font-mono text-sm">{record.key}</p>
      </div>
      <AssetForm mode="edit" defaultValues={record} />
    </div>
  );
}
