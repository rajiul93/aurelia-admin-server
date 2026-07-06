import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";
import { appReleaseConfigService } from "@/services/app-release-config.service";
import type { UpdateAppReleaseConfigPayload } from "@/types/app-content";

export function useUpdateAppReleaseConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAppReleaseConfigPayload) =>
      appReleaseConfigService.update(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.appReleaseConfig.all,
      });
    },
  });
}
