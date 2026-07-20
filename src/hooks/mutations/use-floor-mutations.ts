import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { floorsService } from "@/services/floors.service";
import type {
  CreateFloorPayload,
  CreateTransitionPointPayload,
  UpdateFloorPayload,
  UpdateTransitionPointPayload,
} from "@/types/floor";

function useFloorInvalidation(tourId: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.floors.byTour(tourId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tours.detail(tourId) });
  };
}

export function useCreateFloor(tourId: string) {
  const invalidate = useFloorInvalidation(tourId);

  return useMutation({
    meta: { successMessage: "Floor created" },
    mutationFn: (payload: CreateFloorPayload) =>
      floorsService.create(tourId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateFloor(tourId: string) {
  const invalidate = useFloorInvalidation(tourId);

  return useMutation({
    meta: { successMessage: "Floor updated" },
    mutationFn: ({
      floorId,
      payload,
    }: {
      floorId: string;
      payload: UpdateFloorPayload;
    }) => floorsService.update(tourId, floorId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteFloor(tourId: string) {
  const invalidate = useFloorInvalidation(tourId);

  return useMutation({
    meta: { successMessage: "Floor deleted" },
    mutationFn: (floorId: string) => floorsService.remove(tourId, floorId),
    onSuccess: invalidate,
  });
}

export function useCreateTransitionPoint(tourId: string) {
  const invalidate = useFloorInvalidation(tourId);

  return useMutation({
    meta: { successMessage: "Transition point created" },
    mutationFn: ({
      floorId,
      payload,
    }: {
      floorId: string;
      payload: CreateTransitionPointPayload;
    }) => floorsService.createTransitionPoint(tourId, floorId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTransitionPoint(tourId: string) {
  const invalidate = useFloorInvalidation(tourId);

  return useMutation({
    meta: { successMessage: "Transition point updated" },
    mutationFn: ({
      floorId,
      pointId,
      payload,
    }: {
      floorId: string;
      pointId: string;
      payload: UpdateTransitionPointPayload;
    }) =>
      floorsService.updateTransitionPoint(tourId, floorId, pointId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTransitionPoint(tourId: string) {
  const invalidate = useFloorInvalidation(tourId);

  return useMutation({
    meta: { successMessage: "Transition point deleted" },
    mutationFn: ({ floorId, pointId }: { floorId: string; pointId: string }) =>
      floorsService.removeTransitionPoint(tourId, floorId, pointId),
    onSuccess: invalidate,
  });
}
