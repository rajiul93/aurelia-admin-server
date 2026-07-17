import { withErrorHandler } from "@/lib/api/handler";
import { requireStaffSessionFromRequest } from "@/lib/api/require-staff";
import { success } from "@/lib/api/response";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";
import {
  normalizeReminderHour,
  normalizeReminderNudgeEnabled,
  normalizeReminderOffsetDays,
} from "@/lib/app-release/reminder-cadence";
import { normalizeVenueTimezone } from "@/lib/app-release/venue-timezone";
import { updateAppReleaseConfigSchema } from "@/schemas/app-release-config.schema";

function toAdminConfigDto(
  config: Awaited<ReturnType<typeof appReleaseRepository.getConfig>>,
) {
  return {
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
    reminderOffsetDays: normalizeReminderOffsetDays(config.reminderOffsetDays),
    reminderHour: normalizeReminderHour(config.reminderHour),
    reminderNudgeEnabled: normalizeReminderNudgeEnabled(
      config.reminderNudgeEnabled,
    ),
    venueTimezone: normalizeVenueTimezone(config.venueTimezone),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export const GET = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  const config = await appReleaseRepository.getConfig();
  return success(toAdminConfigDto(config));
});

export const PATCH = withErrorHandler(async (req) => {
  await requireStaffSessionFromRequest(req);
  const body = updateAppReleaseConfigSchema.parse(await req.json());
  const config = await appReleaseRepository.updateConfig(body);
  return success(toAdminConfigDto(config));
});
