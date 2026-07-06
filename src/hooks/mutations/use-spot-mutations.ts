import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { spotsService } from "@/services/spots.service";
import type {
  CreateSpotFaqPayload,
  CreateSpotMediaPayload,
  CreateSpotPayload,
  UpdateSpotFaqPayload,
  UpdateSpotPayload,
} from "@/types/spot";

export function useCreateSpot(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSpotPayload) =>
      spotsService.create(tourId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.list(tourId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tours.detail(tourId),
      });
    },
  });
}

export function useUpdateSpot(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spotId,
      payload,
    }: {
      spotId: string;
      payload: UpdateSpotPayload;
    }) => spotsService.update(tourId, spotId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.list(tourId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.detail(tourId, variables.spotId),
      });
    },
  });
}

export function useDeleteSpot(tourId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (spotId: string) => spotsService.remove(tourId, spotId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.list(tourId),
      });
    },
  });
}

export function useCreateSpotMedia(tourId: string, spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSpotMediaPayload) =>
      spotsService.createMedia(tourId, spotId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.detail(tourId, spotId),
      });
    },
  });
}

export function useDeleteSpotMedia(tourId: string, spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: string) =>
      spotsService.removeMedia(tourId, spotId, mediaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.detail(tourId, spotId),
      });
    },
  });
}

export function useCreateSpotFaq(tourId: string, spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSpotFaqPayload) =>
      spotsService.createFaq(tourId, spotId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.detail(tourId, spotId),
      });
    },
  });
}

export function useDeleteSpotFaq(tourId: string, spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faqId: string) =>
      spotsService.removeFaq(tourId, spotId, faqId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.detail(tourId, spotId),
      });
    },
  });
}

export function useUpdateSpotFaq(tourId: string, spotId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      faqId,
      payload,
    }: {
      faqId: string;
      payload: UpdateSpotFaqPayload;
    }) => spotsService.updateFaq(tourId, spotId, faqId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.spots.detail(tourId, spotId),
      });
    },
  });
}
