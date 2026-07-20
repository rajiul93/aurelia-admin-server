import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";
import { appReleaseConfigService } from "@/services/app-release-config.service";
import type { UpdateAppReleaseConfigPayload } from "@/types/app-content";

export function useUpdateAppReleaseConfig() {
  const queryClient = useQueryClient();

  // Deliberately no successMessage: the release-config panel autosaves on every
  // field blur, so a toast per field would be a stream of noise. The panel
  // already renders its own inline "Saving…" indicator. Errors still toast via
  // the global mutation cache — those were previously silent here.
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
