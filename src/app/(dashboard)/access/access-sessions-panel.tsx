"use client";

import { Loader2, Smartphone, Trash2 } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useRevokeDeviceSession } from "@/hooks/mutations/use-tour-access-mutations";
import { useTourAccessSessions } from "@/hooks/queries/use-tour-access-sessions";
import type { TourAccess } from "@/types/tour-access";

type AccessSessionsPanelProps = {
  access: TourAccess;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function platformLabel(platform: string) {
  switch (platform) {
    case "IOS":
      return "iOS";
    case "ANDROID":
      return "Android";
    default:
      return platform;
  }
}

export function AccessSessionsPanel({ access }: AccessSessionsPanelProps) {
  const { data, isLoading, isError, error, refetch } = useTourAccessSessions(
    access.id,
  );
  const revokeSession = useRevokeDeviceSession();
  const askConfirm = useConfirm();
  const [actionError, setActionError] = useState<string | null>(null);

  const sessions = data?.data ?? [];
  const isRevoked = access.status === "REVOKED";

  async function handleRevoke(sessionId: string, label: string) {
    const confirmed = await askConfirm({
      title: `Remove session for ${label}?`,
      description:
        "That device will be signed out immediately and must log in again.",
      confirmLabel: "Remove",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    setActionError(null);

    try {
      await revokeSession.mutateAsync({
        accessId: access.id,
        sessionId,
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not revoke session.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active devices</CardTitle>
        <CardDescription>
          {access.activeDeviceCount} of {access.maxDevices} device
          {access.maxDevices === 1 ? "" : "s"} in use. The buyer cannot remove a
          device themselves — remove one here to free a slot, and that device
          loses access immediately and must unlock again with the PIN.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionError ? (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {isError ? (
          <div className="space-y-3">
            <p className="text-destructive text-sm">
              {error instanceof Error
                ? error.message
                : "Could not load active sessions."}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No active sessions. This email has not signed in on any device yet.
          </p>
        ) : null}

        {!isLoading && !isError
          ? sessions.map((session) => {
              const label = session.deviceName?.trim() || session.deviceId;

              return (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                      <Smartphone className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{label}</p>
                        <Badge variant="secondary">
                          {platformLabel(session.platform)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Last active {formatDate(session.lastVerifiedAt)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Signed in {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRevoked || revokeSession.isPending}
                    onClick={() => void handleRevoke(session.id, label)}
                  >
                    {revokeSession.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                    Remove session
                  </Button>
                </div>
              );
            })
          : null}
      </CardContent>
    </Card>
  );
}
