import { NotFoundError } from "@/lib/api/errors";
import { appReleaseRepository } from "@/lib/app-release/app-release.repository";

import { mapMobileReleaseConfig } from "./mobile-release-config.mapper";

export const mobileReleaseConfigService = {
  async getPublishedConfig() {
    const config = await appReleaseRepository.getConfig();

    if (config.publishStatus !== "PUBLISHED") {
      throw new NotFoundError("Release config is not published");
    }

    return mapMobileReleaseConfig(config);
  },
};
