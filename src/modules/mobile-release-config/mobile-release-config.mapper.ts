import type { AppReleaseConfig } from "@/generated/prisma/client";

import { normalizeVenueTimezone } from "@/lib/app-release/venue-timezone";
import type { MobileReleaseConfig } from "./mobile-release-config.types";

function parseSupportedLanguages(value: unknown) {
  if (!Array.isArray(value)) {
    return ["en", "es", "fr"];
  }

  return value.filter((item): item is string => typeof item === "string");
}

/**
 * Normalize the admin-set prep offsets: keep whole days in [0, 60], dedupe, and
 * sort largest-first (D-3 before D-1). Falls back to [3, 2, 1] when the stored
 * JSON is missing/garbage. An empty result means "no prep reminders".
 */
function parseReminderOffsetDays(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [3, 2, 1];
  }

  const cleaned = Array.from(
    new Set(
      value
        .filter((item): item is number => typeof item === "number")
        .map((item) => Math.trunc(item))
        .filter((item) => Number.isFinite(item) && item >= 0 && item <= 60),
    ),
  ).sort((a, b) => b - a);

  return cleaned;
}

export function mapMobileReleaseConfig(
  config: AppReleaseConfig,
): MobileReleaseConfig {
  return {
    appContentVersion: config.appContentVersion,
    apiVersion: config.apiVersion,
    schemaVersion: config.schemaVersion,
    remoteConfigVersion: config.remoteConfigVersion,
    publishStatus: config.publishStatus,
    publishedAt: config.publishedAt?.toISOString() ?? null,
    remote: {
      maintenanceMode: config.maintenanceMode,
      maintenanceMessage: config.maintenanceMessage,
      enableOfflineChat: config.enableOfflineChat,
      enableGpsNavigation: config.enableGpsNavigation,
      enableVoiceGuidance: config.enableVoiceGuidance,
      maxDownloadSizeMb: config.maxDownloadSizeMb,
      maxChatHistory: config.maxChatHistory,
      supportedLanguages: parseSupportedLanguages(config.supportedLanguages),
      emergencyAnnouncement: config.emergencyAnnouncement,
      reminderOffsetDays: parseReminderOffsetDays(config.reminderOffsetDays),
      reminderHour: config.reminderHour,
      reminderNudgeEnabled: config.reminderNudgeEnabled,
      venueTimezone: normalizeVenueTimezone(config.venueTimezone),
    },
  };
}
