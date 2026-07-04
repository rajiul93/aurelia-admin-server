import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  CreateFaqCategoryPayload,
  FaqCategory,
  UpdateFaqCategoryPayload,
} from "@/types/faq";

export const faqCategoriesService = {
  list(params?: ListParams & { language?: string }) {
    return apiClient
      .get<ApiSuccess<FaqCategory[]>>("/faq-categories", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<FaqCategory>>(`/faq-categories/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateFaqCategoryPayload) {
    return apiClient
      .post<ApiSuccess<FaqCategory>>("/faq-categories", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateFaqCategoryPayload) {
    return apiClient
      .patch<ApiSuccess<FaqCategory>>(`/faq-categories/${id}`, payload)
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/faq-categories/${id}`)
      .then((response) => response.data);
  },
};
