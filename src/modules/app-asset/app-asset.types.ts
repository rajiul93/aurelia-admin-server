import type { Media } from "@/types/media";
import type { FeatureLifecycle } from "@/modules/app-ui-string/app-ui-string.types";

export type TimeOfDay = "MORNING" | "AFTERNOON" | "EVENING";

export type AppAssetDto = {
  id: string;
  key: string;
  mediaId: string;
  media: Media;
  timeOfDay: TimeOfDay | null;
  lifecycle: FeatureLifecycle;
  createdAt: string;
  updatedAt: string;
};
