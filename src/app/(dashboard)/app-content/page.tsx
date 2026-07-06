"use client";

import Link from "next/link";
import { ImageIcon, Type } from "lucide-react";
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
import { useAppReleaseConfig } from "@/hooks/queries/use-app-content";
import { AppReleaseConfigPanel } from "./app-release-config-panel";

export default function AppContentPage() {
  const { data, isLoading } = useAppReleaseConfig();
  const config = data?.data;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">App Content</h1>
        <p className="text-muted-foreground text-sm">
          CMS-driven UI strings and assets for the mobile app. Changes bump{" "}
          <code>appContentVersion</code> so free and paid users sync offline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Release versions</CardTitle>
          <CardDescription>
            Mobile compares these independently and downloads only what changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                appContentVersion: {config?.appContentVersion ?? "—"}
              </Badge>
              <Badge variant="outline">
                apiVersion: {config?.apiVersion ?? "—"}
              </Badge>
              <Badge variant="outline">
                schemaVersion: {config?.schemaVersion ?? "—"}
              </Badge>
              <Badge variant="outline">
                remoteConfigVersion: {config?.remoteConfigVersion ?? "—"}
              </Badge>
              <Badge variant="secondary">
                {config?.publishStatus ?? "DRAFT"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <AppReleaseConfigPanel />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="size-4" />
              UI Strings
            </CardTitle>
            <CardDescription>
              Titles, buttons, help, errors — en / es / fr.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/app-content/strings" />}
            >
              Manage strings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-4" />
              App Assets
            </CardTitle>
            <CardDescription>
              UI images and morning / afternoon / evening backgrounds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/app-content/assets" />}
            >
              Manage assets
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
