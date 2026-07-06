import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type {
  AppReleaseConfig,
  UpdateAppReleaseConfigPayload,
} from "@/types/app-content";

export const appReleaseConfigService = {
  get() {
    return apiClient
      .get<ApiSuccess<AppReleaseConfig>>("/app-release-config")
      .then((response) => response.data);
  },

  update(payload: UpdateAppReleaseConfigPayload) {
    return apiClient
      .patch<ApiSuccess<AppReleaseConfig>>("/app-release-config", payload)
      .then((response) => response.data);
  },
};
