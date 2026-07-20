import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { faqCategoriesService } from "@/services/faq-categories.service";
import type {
  CreateFaqCategoryPayload,
  UpdateFaqCategoryPayload,
} from "@/types/faq";

export function useCreateFaqCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Category created" },
    mutationFn: (payload: CreateFaqCategoryPayload) =>
      faqCategoriesService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.faqCategories.lists(),
      });
    },
  });
}

export function useUpdateFaqCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Category updated" },
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFaqCategoryPayload;
    }) => faqCategoriesService.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.faqCategories.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.faqCategories.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
    },
  });
}

export function useDeleteFaqCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { successMessage: "Category deleted" },
    mutationFn: (id: string) => faqCategoriesService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.faqCategories.lists(),
      });
    },
  });
}
