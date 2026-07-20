"use client";

import Link from "next/link";
import { Ban, Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  useDeleteTourAccess,
  useRevokeTourAccess,
} from "@/hooks/mutations/use-tour-access-mutations";
import { useTourAccessList } from "@/hooks/queries/use-tour-access";
import type { TourAccessStatus } from "@/types/tour-access";

function statusVariant(status: TourAccessStatus | "PENDING") {
  switch (status) {
    case "ACTIVE":
      return "default" as const;
    case "PENDING":
    case "EXPIRED":
      return "secondary" as const;
    case "REVOKED":
      return "destructive" as const;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AccessList() {
  const { data, isLoading, isError, error, refetch } = useTourAccessList({
    page: 1,
    limit: 50,
  });
  const revokeAccess = useRevokeTourAccess();
  const deleteAccess = useDeleteTourAccess();
  const askConfirm = useConfirm();

  const records = data?.data ?? [];

  async function handleRevoke(id: string, email: string) {
    const confirmed = await askConfirm({
      title: `Revoke access for ${email}?`,
      description: "Active device sessions will lose entitlement.",
      confirmLabel: "Revoke",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    await revokeAccess.mutateAsync(id);
  }

  async function handleDelete(id: string, email: string) {
    const confirmed = await askConfirm({
      title: `Delete access record for ${email}?`,
      description: "This cannot be undone.",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    await deleteAccess.mutateAsync(id);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium tracking-tight">Website buyer access</h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Manually grant tour access after website purchase. Buyers sign in with
            email + OTP and can use up to the configured concurrent session limit.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/access/new" />}>
          <Plus className="size-4" />
          Grant access
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <p className="font-medium">Could not load access records</p>
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
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No access records yet</p>
            <p className="text-muted-foreground text-sm">
              Grant access after a website tour purchase.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && records.length > 0 ? (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(record.effectiveStatus)}>
                    {record.effectiveStatus}
                  </Badge>
                  {record.effectiveStatus !== record.status ? (
                    <Badge variant="outline">Stored: {record.status}</Badge>
                  ) : null}
                  <Badge variant="outline">
                    {record.activeDeviceCount} of {record.maxDevices} device
                    {record.maxDevices === 1 ? "" : "s"}
                  </Badge>
                  {record.pinLockedUntil &&
                  new Date(record.pinLockedUntil) > new Date() ? (
                    <Badge variant="destructive">PIN locked</Badge>
                  ) : null}
                </div>
                <CardTitle className="text-base">{record.phone}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {record.effectiveStatus === "PENDING"
                    ? `Unlocks ${formatDate(record.activatedAt)}`
                    : `Expires ${formatDate(record.expiresAt)}`}{" "}
                  · {record.tours.length} tour
                  {record.tours.length === 1 ? "" : "s"}
                  {record.email ? ` · ${record.email}` : ""}
                </p>
              </CardHeader>

              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-2">
                  {record.tours.map((tour) => (
                    <Badge key={tour.id} variant="secondary">
                      {tour.title}
                    </Badge>
                  ))}
                </div>
                {record.notes ? (
                  <p className="text-muted-foreground mt-3 text-sm">{record.notes}</p>
                ) : null}
              </CardContent>

              <CardFooter className="flex flex-wrap justify-end gap-2 border-t bg-muted/30 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/access/${record.id}/edit`} />}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                {record.status !== "REVOKED" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokeAccess.isPending}
                    onClick={() => void handleRevoke(record.id, record.phone)}
                  >
                    <Ban className="size-4" />
                    Revoke
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteAccess.isPending}
                  onClick={() => void handleDelete(record.id, record.phone)}
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
