import type { AppLanguage } from "@/lib/i18n/languages";
import type { AppAssetDto } from "@/modules/app-asset/app-asset.types";
import type {
  AppUiStringDto,
  FeatureLifecycle,
} from "@/modules/app-ui-string/app-ui-string.types";
import type { TimeOfDay } from "@/modules/app-asset/app-asset.types";

export type { FeatureLifecycle, TimeOfDay };
export type AppUiString = AppUiStringDto;
export type AppAsset = AppAssetDto;

export type CreateAppUiStringPayload = {
  key: string;
  lifecycle: FeatureLifecycle;
  translations: Record<AppLanguage, { value: string }>;
};

export type UpdateAppUiStringPayload = Partial<CreateAppUiStringPayload>;

export type CreateAppAssetPayload = {
  key: string;
  mediaId: string;
  timeOfDay?: TimeOfDay | null;
  lifecycle: FeatureLifecycle;
};

export type UpdateAppAssetPayload = Partial<CreateAppAssetPayload>;

export type AppReleaseConfig = {
  id: string;
  appContentVersion: number;
  apiVersion: number;
  schemaVersion: number;
  remoteConfigVersion: number;
  publishStatus: string;
  publishedAt: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  enableOfflineChat: boolean;
  enableGpsNavigation: boolean;
  enableVoiceGuidance: boolean;
  maxDownloadSizeMb: number;
  maxChatHistory: number;
  supportedLanguages: string[];
  emergencyAnnouncement: string | null;
  reminderOffsetDays: number[];
  reminderHour: number;
  reminderNudgeEnabled: boolean;
  venueTimezone: string;
  updatedAt: string;
};

export type UpdateAppReleaseConfigPayload = {
  publishStatus?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
  apiVersion?: number;
  schemaVersion?: number;
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
  enableOfflineChat?: boolean;
  enableGpsNavigation?: boolean;
  enableVoiceGuidance?: boolean;
  maxDownloadSizeMb?: number;
  maxChatHistory?: number;
  supportedLanguages?: Array<"en" | "es" | "fr">;
  emergencyAnnouncement?: string | null;
  reminderOffsetDays?: number[];
  reminderHour?: number;
  reminderNudgeEnabled?: boolean;
  venueTimezone?: string;
};
