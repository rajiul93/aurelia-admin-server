import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { success } from "@/lib/api/response";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import { updateAppReleaseConfigSchema } from "@/schemas/app-release-config.schema";

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  const config = await appReleaseRepository.getConfig();

  return success({
    id: config.id,
    appContentVersion: config.appContentVersion,
    apiVersion: config.apiVersion,
    schemaVersion: config.schemaVersion,
    remoteConfigVersion: config.remoteConfigVersion,
    publishStatus: config.publishStatus,
    publishedAt: config.publishedAt?.toISOString() ?? null,
    maintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMessage,
    enableOfflineChat: config.enableOfflineChat,
    enableGpsNavigation: config.enableGpsNavigation,
    enableVoiceGuidance: config.enableVoiceGuidance,
    maxDownloadSizeMb: config.maxDownloadSizeMb,
    maxChatHistory: config.maxChatHistory,
    supportedLanguages: config.supportedLanguages,
    emergencyAnnouncement: config.emergencyAnnouncement,
    updatedAt: config.updatedAt.toISOString(),
  });
});

export const PATCH = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  const body = updateAppReleaseConfigSchema.parse(await req.json());
  const config = await appReleaseRepository.updateConfig(body);

  return success({
    id: config.id,
    appContentVersion: config.appContentVersion,
    apiVersion: config.apiVersion,
    schemaVersion: config.schemaVersion,
    remoteConfigVersion: config.remoteConfigVersion,
    publishStatus: config.publishStatus,
    publishedAt: config.publishedAt?.toISOString() ?? null,
    maintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMessage,
    enableOfflineChat: config.enableOfflineChat,
    enableGpsNavigation: config.enableGpsNavigation,
    enableVoiceGuidance: config.enableVoiceGuidance,
    maxDownloadSizeMb: config.maxDownloadSizeMb,
    maxChatHistory: config.maxChatHistory,
    supportedLanguages: config.supportedLanguages,
    emergencyAnnouncement: config.emergencyAnnouncement,
    updatedAt: config.updatedAt.toISOString(),
  });
});
