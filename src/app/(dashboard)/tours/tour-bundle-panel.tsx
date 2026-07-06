"use client";

import { useState } from "react";
import { Loader2, Package } from "lucide-react";
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
import { useBuildTourBundle } from "@/hooks/mutations/use-tour-bundle-mutations";
import { useLatestTourBundle } from "@/hooks/queries/use-tour-bundle";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="size-4" />
          Signed bundle
        </CardTitle>
        <CardDescription>
          Built on publish: manifest, content payload, and offline search
          documents (JSON) with checksums and signature.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPublished ? (
          <p className="text-muted-foreground text-sm">
            Publish the tour to generate a signed offline bundle.
          </p>
        ) : null}

        {isPublished && isLoading ? <Skeleton className="h-20 w-full" /> : null}

        {isPublished && isError && !notFound ? (
          <p className="text-destructive text-sm">{getErrorMessage(error)}</p>
        ) : null}

        {isPublished && (bundle || notFound) ? (
          <>
            {bundle ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    v{bundle.tourBundleVersion}
                  </Badge>
                  <Badge variant="secondary">{bundle.signatureAlgorithm}</Badge>
                  <Badge variant="outline">{bundle.fileCount} files</Badge>
                </div>
                <dl className="text-muted-foreground grid gap-1 text-xs">
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Bundle ID:{" "}
                    </dt>
                    <dd className="inline font-mono">{bundle.bundleId}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Checksum:{" "}
                    </dt>
                    <dd className="inline break-all font-mono">
                      {bundle.checksum}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Built:{" "}
                    </dt>
                    <dd className="inline">
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
              disabled={buildBundle.isPending}
              onClick={() => void handleBuild()}
            >
              {buildBundle.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {bundle ? "Rebuild current version" : "Build bundle"}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
