import { apiClient } from "@/lib/axios";
import type { ApiSuccess, ListParams } from "@/types/api";
import type {
  CreateFaqPayload,
  Faq,
  UpdateFaqPayload,
} from "@/types/faq";

export const faqsService = {
  list(params?: ListParams & { categoryId?: string; language?: string }) {
    return apiClient
      .get<ApiSuccess<Faq[]>>("/faqs", { params })
      .then((response) => response.data);
  },

  getById(id: string) {
    return apiClient
      .get<ApiSuccess<Faq>>(`/faqs/${id}`)
      .then((response) => response.data);
  },

  create(payload: CreateFaqPayload) {
    return apiClient
      .post<ApiSuccess<Faq>>("/faqs", payload)
      .then((response) => response.data);
  },

  update(id: string, payload: UpdateFaqPayload) {
    return apiClient
      .patch<ApiSuccess<Faq>>(`/faqs/${id}`, payload)
      .then((response) => response.data);
  },

  remove(id: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(`/faqs/${id}`)
      .then((response) => response.data);
  },
};
