"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2, Rocket } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConfirm,
  type ConfirmOptions,
} from "@/components/ui/confirm-dialog";
import {
  PublishStatusBadge,
  TOUR_PANEL_CARD,
  TOUR_PANEL_HEADER,
  publishStatusLabels,
} from "@/components/tours/publish-status-badge";
import { useTourLifecycle } from "@/hooks/mutations/use-tour-mutations";
import { useTourReadiness } from "@/hooks/queries/use-tours";
import { cn } from "@/lib/utils";
import type { PublishStatus, TourLifecycleAction } from "@/types/tour";

const actionLabels: Record<TourLifecycleAction, string> = {
  submit_review: "Submit for review",
  approve_publish: "Publish",
  archive: "Archive",
  return_to_draft: "Return to draft",
  rollback: "Rollback to review",
};

const actionConfirm: Partial<Record<TourLifecycleAction, ConfirmOptions>> = {
  approve_publish: {
    title: "Publish this tour?",
    description:
      "It will enter the mobile catalog and tourBundleVersion will bump.",
    confirmLabel: "Publish",
  },
  archive: {
    title: "Archive this tour?",
    description: "It will leave the live catalog.",
    confirmLabel: "Archive",
    destructive: true,
  },
  rollback: {
    title: "Rollback to review?",
    description:
      "The tour will leave the live catalog until published again.",
    confirmLabel: "Rollback",
    destructive: true,
  },
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
  const askConfirm = useConfirm();
  const [actionError, setActionError] = useState<string | null>(null);

  const readiness = data?.data;

  async function handleAction(action: TourLifecycleAction) {
    const confirmOptions = actionConfirm[action];
    if (confirmOptions && !(await askConfirm(confirmOptions))) {
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
    <Card className={TOUR_PANEL_CARD}>
      <div className={cn(TOUR_PANEL_HEADER, "px-5 py-4")}>
        <div className="flex items-center gap-2">
          <Rocket className="text-primary size-4" />
          <CardTitle className="text-brand-deep text-base">
            Publish workflow
          </CardTitle>
        </div>
        <CardDescription className="mt-1 text-xs">
          Draft → Review → Published → Archive
        </CardDescription>
      </div>
      <CardContent className="space-y-4 px-5 py-5">
        {isLoading ? <Skeleton className="h-24 w-full rounded-lg" /> : null}

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
              <PublishStatusBadge status={readiness.publishStatus} />
              {tourBundleVersion !== undefined ? (
                <Badge
                  variant="outline"
                  className="border-brand-tan/50 bg-brand-cream/40 text-[10px]"
                >
                  bundle v{tourBundleVersion}
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold",
                  readiness.ready
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
                )}
              >
                {readiness.ready ? "Ready to publish" : "Not ready"}
              </Badge>
            </div>

            <ul className="space-y-2 rounded-lg bg-muted/30 p-3 ring-1 ring-border/50">
              {readiness.checks.map((check) => (
                <li
                  key={check.id}
                  className="flex items-start gap-2.5 text-sm"
                >
                  {check.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  )}
                  <span
                    className={cn(
                      check.ok ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>

            {actionError ? (
              <Alert variant="destructive">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-2">
              {readiness.availableActions.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant={
                    action === "approve_publish" ? "default" : "outline"
                  }
                  size="sm"
                  className={cn(
                    action !== "approve_publish" &&
                      "border-brand-tan/70 hover:bg-brand-cream/60",
                  )}
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

            <p className="text-muted-foreground text-[10px] leading-relaxed">
              Current step:{" "}
              <span className="font-medium">
                {publishStatusLabels[readiness.publishStatus as PublishStatus]}
              </span>
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
