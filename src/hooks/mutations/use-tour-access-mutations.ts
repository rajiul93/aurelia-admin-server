import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { tourAccessService } from "@/services/tour-access.service";
import type {
  CreateTourAccessPayload,
  UpdateTourAccessPayload,
} from "@/types/tour-access";

export function useCreateTourAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTourAccessPayload) =>
      tourAccessService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.lists(),
      });
    },
  });
}

export function useUpdateTourAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTourAccessPayload;
    }) => tourAccessService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.detail(variables.id),
      });
    },
  });
}

export function useRevokeTourAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tourAccessService.revoke(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.detail(id),
      });
    },
  });
}

export function useDeleteTourAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tourAccessService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.lists(),
      });
    },
  });
}
