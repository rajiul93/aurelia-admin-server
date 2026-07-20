import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { faqsService } from "@/services/faqs.service";
import type { CreateFaqPayload, UpdateFaqPayload } from "@/types/faq";

export function useCreateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "FAQ created" },
    mutationFn: (payload: CreateFaqPayload) => faqsService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "FAQ updated" },
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFaqPayload;
    }) => faqsService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.faqs.detail(variables.id),
      });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "FAQ deleted" },
    mutationFn: (id: string) => faqsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
    },
  });
}
