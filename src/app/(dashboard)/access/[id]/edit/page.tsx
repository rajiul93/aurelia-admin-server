"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTourAccess } from "@/hooks/queries/use-tour-access";
import { TourAccessForm } from "../../access-form";
import { AccessSessionsPanel } from "../../access-sessions-panel";

export default function EditAccessPage() {
  const params = useParams<{ id: string }>();
  const accessId = params.id;

  const { data, isLoading, isError, error } = useTourAccess(accessId);
  const access = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !access) {
    return (
      <div className="space-y-4">
        <p className="font-medium">Could not load access record</p>
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Access record not found."}
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/access" />}>
          Back to access list
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Tour Access</h1>
        <p className="text-muted-foreground text-sm">
          Update permissions for {access.email}.
        </p>
      </div>
      <TourAccessForm mode="edit" defaultValues={access} />
      <AccessSessionsPanel access={access} />
    </div>
  );
}
