"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
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
import { useTourLifecycle } from "@/hooks/mutations/use-tour-mutations";
import { useTourReadiness } from "@/hooks/queries/use-tours";
import type { PublishStatus, TourLifecycleAction } from "@/types/tour";

const statusLabels: Record<PublishStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "Review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const actionLabels: Record<TourLifecycleAction, string> = {
  submit_review: "Submit for review",
  approve_publish: "Publish",
  archive: "Archive",
  return_to_draft: "Return to draft",
  rollback: "Rollback to review",
};

const actionConfirm: Partial<Record<TourLifecycleAction, string>> = {
  approve_publish:
    "Publish this tour? It will enter the mobile catalog and tourBundleVersion will bump.",
  archive: "Archive this tour? It will leave the live catalog.",
  rollback:
    "Rollback to review? The tour will leave the live catalog until published again.",
};

function getLifecycleErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof error.response.data.error === "object" &&
    error.response.data.error !== null &&
    "message" in error.response.data.error &&
    typeof error.response.data.error.message === "string"
  ) {
    return error.response.data.error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Lifecycle action failed.";
}

type TourLifecyclePanelProps = {
  tourId: string;
  tourBundleVersion?: number;
};

export function TourLifecyclePanel({
  tourId,
  tourBundleVersion,
}: TourLifecyclePanelProps) {
  const { data, isLoading, isError, error } = useTourReadiness(tourId);
  const transition = useTourLifecycle(tourId);
  const [actionError, setActionError] = useState<string | null>(null);

  const readiness = data?.data;

  async function handleAction(action: TourLifecycleAction) {
    const confirmMessage = actionConfirm[action];
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setActionError(null);

    try {
      await transition.mutateAsync(action);
    } catch (err) {
      setActionError(getLifecycleErrorMessage(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish workflow</CardTitle>
        <CardDescription>
          Draft → Review → Published → Archive. Only published tours enter
          production bundles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? <Skeleton className="h-24 w-full" /> : null}

        {isError ? (
          <p className="text-destructive text-sm">
            {error instanceof Error
              ? error.message
              : "Could not load publish status."}
          </p>
        ) : null}

        {readiness ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {statusLabels[readiness.publishStatus]}
              </Badge>
              {tourBundleVersion !== undefined ? (
                <Badge variant="secondary">
                  tourBundleVersion: {tourBundleVersion}
                </Badge>
              ) : null}
              <Badge variant={readiness.ready ? "default" : "secondary"}>
                {readiness.ready ? "Ready to publish" : "Not ready"}
              </Badge>
            </div>

            <ul className="space-y-2">
              {readiness.checks.map((check) => (
                <li
                  key={check.id}
                  className="text-muted-foreground flex items-center gap-2 text-sm"
                >
                  {check.ok ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                  {check.label}
                </li>
              ))}
            </ul>

            {actionError ? (
              <Alert variant="destructive">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {readiness.availableActions.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant={
                    action === "approve_publish" ? "default" : "outline"
                  }
                  size="sm"
                  disabled={
                    transition.isPending ||
                    ((action === "approve_publish" ||
                      action === "submit_review") &&
                      !readiness.ready)
                  }
                  onClick={() => void handleAction(action)}
                >
                  {transition.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {actionLabels[action]}
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
