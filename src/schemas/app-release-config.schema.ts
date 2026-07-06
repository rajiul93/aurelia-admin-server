import { z } from "zod";

export const updateAppReleaseConfigSchema = z.object({
  publishStatus: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  apiVersion: z.number().int().min(1).optional(),
  schemaVersion: z.number().int().min(1).optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(500).nullable().optional(),
  enableOfflineChat: z.boolean().optional(),
  enableGpsNavigation: z.boolean().optional(),
  enableVoiceGuidance: z.boolean().optional(),
  maxDownloadSizeMb: z.number().int().min(50).max(5000).optional(),
  maxChatHistory: z.number().int().min(10).max(500).optional(),
  supportedLanguages: z.array(z.enum(["en", "es", "fr"])).min(1).optional(),
  emergencyAnnouncement: z.string().trim().max(500).nullable().optional(),
});

export type UpdateAppReleaseConfigInput = z.infer<
  typeof updateAppReleaseConfigSchema
>;
