"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateAppReleaseConfig } from "@/hooks/mutations/use-app-release-config-mutations";
import { useAppReleaseConfig } from "@/hooks/queries/use-app-content";
import type { UpdateAppReleaseConfigPayload } from "@/types/app-content";

export function AppReleaseConfigPanel() {
  const { data, isLoading } = useAppReleaseConfig();
  const updateConfig = useUpdateAppReleaseConfig();
  const config = data?.data;
  const [message, setMessage] = useState<string | null>(null);

  async function save(payload: UpdateAppReleaseConfigPayload) {
    setMessage(null);

    try {
      await updateConfig.mutateAsync(payload);
      setMessage("Release config saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save release config.",
      );
    }
  }

  if (isLoading || !config) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remote config &amp; release</CardTitle>
        <CardDescription>
          Mobile apps sync this when published. Changing flags bumps{" "}
          <code>remoteConfigVersion</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="publishStatus">Publish status</Label>
            <select
              id="publishStatus"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={config.publishStatus}
              onChange={(event) =>
                void save({
                  publishStatus: event.target
                    .value as UpdateAppReleaseConfigPayload["publishStatus"],
                })
              }
            >
              <option value="DRAFT">DRAFT</option>
              <option value="REVIEW">REVIEW</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>remoteConfigVersion</Label>
            <Input value={String(config.remoteConfigVersion)} readOnly />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              key: "maintenanceMode" as const,
              label: "Maintenance mode",
              description: "Blocks the mobile app except settings.",
            },
            {
              key: "enableOfflineChat" as const,
              label: "Offline chat",
              description: "Ask Aurelia keyword search.",
            },
            {
              key: "enableGpsNavigation" as const,
              label: "GPS navigation",
              description: "Future footprint navigation.",
            },
            {
              key: "enableVoiceGuidance" as const,
              label: "Voice guidance",
              description: "Audio guide playback.",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <input
                type="checkbox"
                checked={config[item.key]}
                onChange={(event) =>
                  void save({ [item.key]: event.target.checked })
                }
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="text-muted-foreground block text-xs">
                  {item.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxDownloadSizeMb">Max download size (MB)</Label>
            <Input
              id="maxDownloadSizeMb"
              type="number"
              defaultValue={config.maxDownloadSizeMb}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) {
                  void save({ maxDownloadSizeMb: value });
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxChatHistory">Max chat history</Label>
            <Input
              id="maxChatHistory"
              type="number"
              defaultValue={config.maxChatHistory}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) {
                  void save({ maxChatHistory: value });
                }
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenanceMessage">Maintenance message</Label>
          <textarea
            id="maintenanceMessage"
            className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            defaultValue={config.maintenanceMessage ?? ""}
            onBlur={(event) =>
              void save({
                maintenanceMessage: event.target.value.trim() || null,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyAnnouncement">Emergency announcement</Label>
          <textarea
            id="emergencyAnnouncement"
            className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
            defaultValue={config.emergencyAnnouncement ?? ""}
            onBlur={(event) =>
              void save({
                emergencyAnnouncement: event.target.value.trim() || null,
              })
            }
          />
        </div>

        {message ? (
          <p className="text-muted-foreground text-sm">{message}</p>
        ) : null}

        {updateConfig.isPending ? (
          <p className="text-muted-foreground text-sm">Saving…</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
