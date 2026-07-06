import { apiClient } from "@/lib/axios";
import type { ApiSuccess } from "@/types/api";
import type {
  AiKnowledge,
  CreateAiKnowledgePayload,
  UpdateAiKnowledgePayload,
} from "@/types/ai-knowledge";

export const aiKnowledgeService = {
  list(tourId: string) {
    return apiClient
      .get<ApiSuccess<AiKnowledge[]>>(`/tours/${tourId}/ai-knowledge`)
      .then((response) => response.data);
  },

  getById(tourId: string, knowledgeId: string) {
    return apiClient
      .get<ApiSuccess<AiKnowledge>>(
        `/tours/${tourId}/ai-knowledge/${knowledgeId}`,
      )
      .then((response) => response.data);
  },

  create(tourId: string, payload: CreateAiKnowledgePayload) {
    return apiClient
      .post<ApiSuccess<AiKnowledge>>(`/tours/${tourId}/ai-knowledge`, payload)
      .then((response) => response.data);
  },

  update(
    tourId: string,
    knowledgeId: string,
    payload: UpdateAiKnowledgePayload,
  ) {
    return apiClient
      .patch<ApiSuccess<AiKnowledge>>(
        `/tours/${tourId}/ai-knowledge/${knowledgeId}`,
        payload,
      )
      .then((response) => response.data);
  },

  remove(tourId: string, knowledgeId: string) {
    return apiClient
      .delete<ApiSuccess<{ deleted: boolean }>>(
        `/tours/${tourId}/ai-knowledge/${knowledgeId}`,
      )
      .then((response) => response.data);
  },
};
