import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { appAssetsService } from "@/services/app-assets.service";
import { appReleaseConfigService } from "@/services/app-release-config.service";
import { appUiStringsService } from "@/services/app-ui-strings.service";
import type { ListParams } from "@/types/api";
import type { FeatureLifecycle, TimeOfDay } from "@/types/app-content";

export function useAppReleaseConfig() {
  return useQuery({
    queryKey: queryKeys.appReleaseConfig.all,
    queryFn: () => appReleaseConfigService.get(),
  });
}

export function useAppUiStrings(
  params?: ListParams & { lifecycle?: FeatureLifecycle; search?: string },
) {
  return useQuery({
    queryKey: queryKeys.appUiStrings.list(params),
    queryFn: () => appUiStringsService.list(params),
  });
}

export function useAppUiString(id: string) {
  return useQuery({
    queryKey: queryKeys.appUiStrings.detail(id),
    queryFn: () => appUiStringsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useAppAssets(
  params?: ListParams & {
    lifecycle?: FeatureLifecycle;
    timeOfDay?: TimeOfDay;
    search?: string;
  },
) {
  return useQuery({
    queryKey: queryKeys.appAssets.list(params),
    queryFn: () => appAssetsService.list(params),
  });
}

export function useAppAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.appAssets.detail(id),
    queryFn: () => appAssetsService.getById(id),
    enabled: Boolean(id),
  });
}
