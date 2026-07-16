import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/prisma-retry";
import type { UpdateAppReleaseConfigInput } from "@/schemas/app-release-config.schema";

const REMOTE_CONFIG_FIELDS = [
  "maintenanceMode",
  "maintenanceMessage",
  "enableOfflineChat",
  "enableGpsNavigation",
  "enableVoiceGuidance",
  "maxDownloadSizeMb",
  "maxChatHistory",
  "supportedLanguages",
  "emergencyAnnouncement",
  "reminderOffsetDays",
  "reminderHour",
  "reminderNudgeEnabled",
] as const satisfies ReadonlyArray<keyof UpdateAppReleaseConfigInput>;

export const appReleaseRepository = {
  getConfig() {
    // Runs on every mobile request (via requireCompatibleApiVersion). Retry
    // transient Neon cold-start failures so a suspended-compute wake-up doesn't
    // surface as a 500. The upsert is keyed by a fixed id, so it is idempotent
    // and safe to retry.
    return withDbRetry(() =>
      prisma.appReleaseConfig.upsert({
        where: { id: "singleton" },
        create: { id: "singleton" },
        update: {},
      }),
    );
  },

  async bumpAppContentVersion() {
    await prisma.appReleaseConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", appContentVersion: 2 },
      update: { appContentVersion: { increment: 1 } },
    });
  },

  async bumpKnowledgeVersion() {
    await prisma.appReleaseConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", knowledgeVersion: 2 },
      update: { knowledgeVersion: { increment: 1 } },
    });
  },

  async updateConfig(input: UpdateAppReleaseConfigInput) {
    const bumpsRemoteConfig = REMOTE_CONFIG_FIELDS.some(
      (field) => input[field] !== undefined,
    );

    const data: Prisma.AppReleaseConfigUpdateInput = {
      publishStatus: input.publishStatus,
      apiVersion: input.apiVersion,
      schemaVersion: input.schemaVersion,
      maintenanceMode: input.maintenanceMode,
      maintenanceMessage: input.maintenanceMessage,
      enableOfflineChat: input.enableOfflineChat,
      enableGpsNavigation: input.enableGpsNavigation,
      enableVoiceGuidance: input.enableVoiceGuidance,
      maxDownloadSizeMb: input.maxDownloadSizeMb,
      maxChatHistory: input.maxChatHistory,
      supportedLanguages: input.supportedLanguages,
      emergencyAnnouncement: input.emergencyAnnouncement,
      reminderOffsetDays: input.reminderOffsetDays,
      reminderHour: input.reminderHour,
      reminderNudgeEnabled: input.reminderNudgeEnabled,
    };

    if (input.publishStatus === "PUBLISHED") {
      data.publishedAt = new Date();
    }

    if (bumpsRemoteConfig) {
      data.remoteConfigVersion = { increment: 1 };
    }

    return prisma.appReleaseConfig.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        publishStatus: input.publishStatus ?? "DRAFT",
        apiVersion: input.apiVersion ?? 1,
        schemaVersion: input.schemaVersion ?? 1,
        maintenanceMode: input.maintenanceMode ?? false,
        maintenanceMessage: input.maintenanceMessage ?? null,
        enableOfflineChat: input.enableOfflineChat ?? true,
        enableGpsNavigation: input.enableGpsNavigation ?? false,
        enableVoiceGuidance: input.enableVoiceGuidance ?? true,
        maxDownloadSizeMb: input.maxDownloadSizeMb ?? 500,
        maxChatHistory: input.maxChatHistory ?? 50,
        supportedLanguages: input.supportedLanguages ?? ["en", "es", "fr"],
        emergencyAnnouncement: input.emergencyAnnouncement ?? null,
        reminderOffsetDays: input.reminderOffsetDays ?? [3, 2, 1],
        reminderHour: input.reminderHour ?? 9,
        reminderNudgeEnabled: input.reminderNudgeEnabled ?? true,
        publishedAt: input.publishStatus === "PUBLISHED" ? new Date() : null,
      },
      update: data,
    });
  },
};
