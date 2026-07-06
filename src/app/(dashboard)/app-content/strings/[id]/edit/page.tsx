"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppUiString } from "@/hooks/queries/use-app-content";
import { StringForm } from "../../string-form";

export default function EditAppUiStringPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useAppUiString(params.id);
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
        <p className="font-medium">Could not load UI string</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Not found."}
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/app-content/strings" />}
        >
          Back to strings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit UI String</h1>
        <p className="text-muted-foreground font-mono text-sm">{record.key}</p>
      </div>
      <StringForm mode="edit" defaultValues={record} />
    </div>
  );
}
