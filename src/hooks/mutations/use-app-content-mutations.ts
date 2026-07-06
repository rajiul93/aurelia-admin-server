import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { appAssetsService } from "@/services/app-assets.service";
import { appUiStringsService } from "@/services/app-ui-strings.service";
import type {
  CreateAppAssetPayload,
  CreateAppUiStringPayload,
  UpdateAppAssetPayload,
  UpdateAppUiStringPayload,
} from "@/types/app-content";

function invalidateAppContent(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.appReleaseConfig.all,
  });
}

export function useCreateAppUiString() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppUiStringPayload) =>
      appUiStringsService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appUiStrings.lists(),
      });
      invalidateAppContent(queryClient);
    },
  });
}

export function useUpdateAppUiString() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAppUiStringPayload;
    }) => appUiStringsService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appUiStrings.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appUiStrings.detail(variables.id),
      });
      invalidateAppContent(queryClient);
    },
  });
}

export function useDeleteAppUiString() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appUiStringsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appUiStrings.lists(),
      });
      invalidateAppContent(queryClient);
    },
  });
}

export function useCreateAppAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppAssetPayload) =>
      appAssetsService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appAssets.lists(),
      });
      invalidateAppContent(queryClient);
    },
  });
}

export function useUpdateAppAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAppAssetPayload;
    }) => appAssetsService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appAssets.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appAssets.detail(variables.id),
      });
      invalidateAppContent(queryClient);
    },
  });
}

export function useDeleteAppAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appAssetsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appAssets.lists(),
      });
      invalidateAppContent(queryClient);
    },
  });
}
