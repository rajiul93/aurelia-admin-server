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
import { isValidTimezone } from "@/lib/app-release/venue-timezone";
import type { UpdateAppReleaseConfigPayload } from "@/types/app-content";

/**
 * Parse the comma-separated "days before visit" input into a clean, deduped,
 * largest-first list of whole days in [0, 60]. Returns [] for an empty input
 * (disables prep reminders) and null when the text has no valid numbers at all
 * (so a typo doesn't silently wipe the schedule).
 */
function parseOffsetDays(raw: string): number[] | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return [];
  }

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  const numbers = tokens
    .map((token) => Number(token))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 60);

  if (numbers.length === 0) {
    return null;
  }

  return Array.from(new Set(numbers)).sort((a, b) => b - a);
}

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

        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Venue</p>
            <p className="text-muted-foreground text-xs">
              The venue&apos;s own clock. Host opening hours are read against it,
              so it must be the site&apos;s timezone — not the server&apos;s and
              not the visitor&apos;s.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueTimezone">Timezone (IANA)</Label>
            <Input
              id="venueTimezone"
              defaultValue={config.venueTimezone ?? "Europe/Rome"}
              placeholder="Europe/Rome"
              onBlur={(event) => {
                const value = event.target.value.trim();
                if (!value || value === config.venueTimezone) {
                  return;
                }

                // A typo here would silently shift every host's hours, so refuse
                // it and say so rather than saving something unreadable.
                if (!isValidTimezone(value)) {
                  setMessage(
                    `"${value}" is not a valid IANA timezone. Try e.g. Europe/Rome.`,
                  );
                  return;
                }

                void save({ venueTimezone: value });
              }}
            />
            <p className="text-muted-foreground text-xs">
              e.g. <code>Europe/Rome</code>, <code>America/New_York</code>.
              Changing this re-evaluates every host&apos;s availability.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Tour reminders</p>
            <p className="text-muted-foreground text-xs">
              Controls when prep notifications fire on the mobile app. Applies to
              tours whose visit date the buyer hasn&apos;t overridden.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reminderOffsetDays">
                Days before visit (comma-separated)
              </Label>
              <Input
                id="reminderOffsetDays"
                defaultValue={(config.reminderOffsetDays ?? [3, 2, 1]).join(
                  ", ",
                )}
                placeholder="3, 2, 1"
                onBlur={(event) => {
                  const parsed = parseOffsetDays(event.target.value);
                  if (parsed) {
                    void save({ reminderOffsetDays: parsed });
                  }
                }}
              />
              <p className="text-muted-foreground text-xs">
                e.g. <code>7, 3, 1</code> sends reminders 7, 3, and 1 day before.
                Leave empty to disable prep reminders.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderHour">Reminder hour (0–23, local)</Label>
              <Input
                id="reminderHour"
                type="number"
                min={0}
                max={23}
                defaultValue={config.reminderHour ?? 9}
                onBlur={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isInteger(value) && value >= 0 && value <= 23) {
                    void save({ reminderHour: value });
                  }
                }}
              />
              <p className="text-muted-foreground text-xs">
                Local device time each reminder fires (e.g. <code>9</code> = 9 AM).
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={config.reminderNudgeEnabled ?? true}
              onChange={(event) =>
                void save({ reminderNudgeEnabled: event.target.checked })
              }
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">
                Daily &ldquo;set a date&rdquo; nudge
              </span>
              <span className="text-muted-foreground block text-xs">
                Reminds buyers who skipped picking a visit date, once a day.
              </span>
            </span>
          </label>
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
