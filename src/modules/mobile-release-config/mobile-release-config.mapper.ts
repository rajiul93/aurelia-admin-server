import type { AppReleaseConfig } from "@/generated/prisma/client";

import type { MobileReleaseConfig } from "./mobile-release-config.types";

function parseSupportedLanguages(value: unknown) {
  if (!Array.isArray(value)) {
    return ["en", "es", "fr"];
  }

  return value.filter((item): item is string => typeof item === "string");
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
    },
  };
}
