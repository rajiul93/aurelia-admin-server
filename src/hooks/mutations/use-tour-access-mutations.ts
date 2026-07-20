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
    meta: { successMessage: "Access grant created" },
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
    meta: { successMessage: "Access grant updated" },
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
    meta: { successMessage: "Access revoked" },
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
    meta: { successMessage: "Access grant deleted" },
    mutationFn: (id: string) => tourAccessService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.lists(),
      });
    },
  });
}

export function useRevokeDeviceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Device session revoked" },
    mutationFn: ({
      accessId,
      sessionId,
    }: {
      accessId: string;
      sessionId: string;
    }) => tourAccessService.revokeSession(accessId, sessionId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.sessions(variables.accessId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.detail(variables.accessId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tourAccess.lists(),
      });
    },
  });
}
