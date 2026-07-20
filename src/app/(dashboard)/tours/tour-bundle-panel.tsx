"use client";

import { useState } from "react";
import { Loader2, Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TOUR_PANEL_CARD,
  TOUR_PANEL_HEADER,
} from "@/components/tours/publish-status-badge";
import { useBuildTourBundle } from "@/hooks/mutations/use-tour-bundle-mutations";
import { useLatestTourBundle } from "@/hooks/queries/use-tour-bundle";
import { cn } from "@/lib/utils";
import type { PublishStatus } from "@/types/tour";

type TourBundlePanelProps = {
  tourId: string;
  publishStatus: PublishStatus;
};

function getErrorMessage(error: unknown) {
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

  return "Bundle action failed.";
}

export function TourBundlePanel({
  tourId,
  publishStatus,
}: TourBundlePanelProps) {
  const isPublished = publishStatus === "PUBLISHED";
  const { data, isLoading, isError, error, refetch } = useLatestTourBundle(
    tourId,
    isPublished,
  );
  const buildBundle = useBuildTourBundle(tourId);
  const [actionError, setActionError] = useState<string | null>(null);

  const bundle = data?.data;
  const notFound =
    isError &&
    error instanceof Error &&
    /not found|no bundle/i.test(error.message);

  async function handleBuild() {
    setActionError(null);

    try {
      await buildBundle.mutateAsync();
      await refetch();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  return (
    <Card className={TOUR_PANEL_CARD}>
      <div className={cn(TOUR_PANEL_HEADER, "px-5 py-4")}>
        <div className="flex items-center gap-2">
          <Package className="text-primary size-4" />
          <CardTitle className="text-brand-deep text-base">
            Signed bundle
          </CardTitle>
        </div>
        <CardDescription className="mt-1 text-xs">
          Offline manifest for the mobile app
        </CardDescription>
      </div>
      <CardContent className="space-y-4 px-5 py-5">
        {!isPublished ? (
          <p className="text-muted-foreground rounded-lg bg-muted/30 p-3 text-sm ring-1 ring-border/50">
            Publish the tour to generate a signed offline bundle.
          </p>
        ) : null}

        {isPublished && isLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : null}

        {isPublished && isError && !notFound ? (
          <p className="text-destructive text-sm">{getErrorMessage(error)}</p>
        ) : null}

        {isPublished && (bundle || notFound) ? (
          <>
            {bundle ? (
              <div className="space-y-3 rounded-lg bg-brand-cream/20 p-3 ring-1 ring-brand-tan/40">
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className="border-brand-tan/60 bg-background/70"
                  >
                    v{bundle.tourBundleVersion}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {bundle.signatureAlgorithm}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {bundle.fileCount} files
                  </Badge>
                </div>
                <dl className="text-muted-foreground space-y-1.5 text-xs">
                  <div>
                    <dt className="text-foreground font-medium">Bundle ID</dt>
                    <dd className="font-mono break-all">{bundle.bundleId}</dd>
                  </div>
                  <div>
                    <dt className="text-foreground font-medium">Built</dt>
                    <dd>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(bundle.createdAt))}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No bundle artifact yet for this published version.
              </p>
            )}

            {actionError ? (
              <Alert variant="destructive">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-brand-tan/70 w-full hover:bg-brand-cream/60"
              disabled={buildBundle.isPending}
              onClick={() => void handleBuild()}
            >
              {buildBundle.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {bundle ? "Rebuild bundle" : "Build bundle"}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
