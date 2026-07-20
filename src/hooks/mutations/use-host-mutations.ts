import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { hostsService } from "@/services/hosts.service";
import type { CreateHostPayload, UpdateHostPayload } from "@/types/host";

export function useCreateHost(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Host created" },
    mutationFn: (payload: CreateHostPayload) =>
      hostsService.create(tourId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.hosts.byTour(tourId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tours.detail(tourId),
      });
    },
  });
}

export function useUpdateHost(tourId: string, hostId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Host updated" },
    mutationFn: (payload: UpdateHostPayload) =>
      hostsService.update(tourId, hostId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.hosts.detail(tourId, hostId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.hosts.byTour(tourId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tours.detail(tourId),
      });
    },
  });
}

export function useDeleteHost(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Host deleted" },
    mutationFn: (hostId: string) => hostsService.delete(tourId, hostId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.hosts.byTour(tourId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tours.detail(tourId),
      });
    },
  });
}
